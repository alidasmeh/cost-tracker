// Data layer: talks to Firestore directly (no backend). Same interface the pages used before.
//   users/{uid}                     { homeWallet, homeMigrated, defaultWallet }  (+ legacy categories/years/expenses/months)
//   wallets/{code}                  { name, owner, members: uid[], categories: string[], years: number[], createdAt }
//   wallets/{code}/expenses/{id}    { year, month, day, title, amount, category, note, createdAt }
//   wallets/{code}/months/{YYYY-MM} { fixed, income, prediction, dailyBudget, note }
// The 6-character wallet code is the document ID, so Firestore keeps it unique; sharing it lets others join.
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, documentId, arrayUnion,
  arrayRemove, writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase.js';

export const DEFAULT_CATEGORIES = ['food', 'groceries', 'snack', 'necessities', 'for home', 'clothes',
  'health', 'transportation', 'travel', 'gym', 'others'];
const DEFAULT_MONTH = { fixed: 0, income: 0, prediction: 3000, dailyBudget: 50, note: '' };
const monthKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
const round = (n) => Math.round(n * 100) / 100;

const uid = () => { const u = auth.currentUser?.uid; if (!u) throw new Error('Please sign in'); return u; };
const userDoc = () => doc(db, 'users', uid());

// The wallet every call below reads and writes; App sets it after loading the user's wallets.
let walletId = null;
export const setWallet = (id) => { walletId = id; };
const walletDoc = (id = walletId) => { if (!id) throw new Error('No wallet selected'); return doc(db, 'wallets', id); };
const expensesCol = (id) => collection(walletDoc(id), 'expenses');
const monthsCol = (id) => collection(walletDoc(id), 'months');

// No 0/O/1/I so codes are easy to read out; always mixes letters and digits.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() {
  for (;;) {
    const code = Array.from(crypto.getRandomValues(new Uint32Array(6)), (n) => CODE_CHARS[n % CODE_CHARS.length]).join('');
    if (/[A-Z]/.test(code) && /[0-9]/.test(code)) return code;
  }
}

function computeMonth(year, month, items, metaDoc) {
  const meta = { ...DEFAULT_MONTH, ...(metaDoc || {}) };
  const spent = items.reduce((s, e) => s + e.amount, 0);
  const necessities = items.filter((e) => e.category === 'necessities').reduce((s, e) => s + e.amount, 0);
  const byCategory = {};
  for (const e of items) byCategory[e.category] = round((byCategory[e.category] || 0) + e.amount);
  const lastDay = items.reduce((m, e) => Math.max(m, e.day || 0), 0);
  const total = spent + meta.fixed;
  return {
    year, month, meta, count: items.length,
    spent: round(spent), total: round(total), necessities: round(necessities),
    notNecessities: round(spent - necessities),
    deviation: round(meta.prediction - total),          // vs. prediction
    remained: round(meta.income - total),               // remained from income
    aheadOfBudget: round(meta.dailyBudget * lastDay - (spent - necessities)),
    byCategory,
  };
}

function clean(e) {
  const out = {
    year: Number.parseInt(e.year, 10),
    month: Number.parseInt(e.month, 10),
    day: e.day === '' || e.day == null ? null : Number.parseInt(e.day, 10),
    title: String(e.title ?? '').trim(),
    amount: Number(String(e.amount).replace(',', '.')),
    category: String(e.category ?? '').trim().toLowerCase(),
    note: String(e.note ?? ''),
  };
  if (!out.title) throw new Error('Title is required');
  if (!Number.isFinite(out.amount)) throw new Error('Amount must be a number');
  if (!out.category) throw new Error('Category is required');
  if (out.day != null && !(out.day >= 1 && out.day <= 31)) throw new Error('Invalid day');
  return out;
}

const remember = (e) => updateDoc(walletDoc(), { categories: arrayUnion(e.category), years: arrayUnion(e.year) });

async function createWallet(name, extra = {}) {
  const data = { name: String(name).trim().slice(0, 40), owner: uid(), members: [uid()],
    categories: DEFAULT_CATEGORIES, years: [], createdAt: Date.now(), ...extra };
  if (!data.name) throw new Error('Wallet name is required');
  // A taken code is someone else's wallet, which the rules refuse to overwrite: just draw another.
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try { await setDoc(doc(db, 'wallets', code), data); return { id: code, ...data }; }
    catch (e) { if (e.code !== 'permission-denied') throw e; }
  }
  // Five taken codes in a row is practically impossible, so the rules themselves refused it.
  throw new Error('The database refused to create the wallet. If the app was just updated, '
    + 'deploy the new Firestore rules too (npm run deploy).');
}

// First run after wallets existed: copy the old per-user data into the Home wallet. Doc IDs are kept,
// so if this is interrupted it just redoes the same writes next time.
async function migrateIntoHome(code) {
  const [exp, months] = await Promise.all([
    getDocs(collection(userDoc(), 'expenses')), getDocs(collection(userDoc(), 'months'))]);
  const writes = [
    ...exp.docs.map((d) => [doc(expensesCol(code), d.id), d.data()]),
    ...months.docs.map((d) => [doc(monthsCol(code), d.id), d.data()]),
  ];
  for (let i = 0; i < writes.length; i += 400) {
    const b = writeBatch(db);
    for (const [ref, data] of writes.slice(i, i + 400)) b.set(ref, data);
    await b.commit();
  }
  await setDoc(userDoc(), { homeMigrated: true }, { merge: true });
}

export const api = {
  // All wallets the user belongs to (creating and filling Home on first use), Home first,
  // plus which one the app opens on: the chosen default if still a member, else Home.
  async wallets() {
    const user = (await getDoc(userDoc())).data() || {};
    let home = user.homeWallet;
    if (!home) {
      const w = await createWallet('Home', { categories: user.categories || DEFAULT_CATEGORIES, years: user.years || [] });
      home = w.id;
      await setDoc(userDoc(), { homeWallet: home, homeMigrated: false }, { merge: true });
    }
    if (!user.homeMigrated) await migrateIntoHome(home);
    const snap = await getDocs(query(collection(db, 'wallets'), where('members', 'array-contains', uid())));
    const wallets = snap.docs.map((d) => ({ id: d.id, ...d.data(), home: d.id === home }))
      .sort((a, b) => b.home - a.home || a.createdAt - b.createdAt);
    const defaultId = wallets.some((w) => w.id === user.defaultWallet) ? user.defaultWallet : home;
    return { wallets, defaultId };
  },

  setDefaultWallet: (id) => setDoc(userDoc(), { defaultWallet: id }, { merge: true }),

  createWallet: (name) => createWallet(name),

  async joinWallet(code) {
    const id = String(code).trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(id)) throw new Error('A wallet code is 6 letters and digits');
    try { await updateDoc(doc(db, 'wallets', id), { members: arrayUnion(uid()) }); }
    catch (e) { throw new Error(e.code === 'not-found' || e.code === 'permission-denied' ? 'No wallet with that code' : e.message); }
    return id;
  },

  leaveWallet: (id) => updateDoc(doc(db, 'wallets', id), { members: arrayRemove(uid()) }),

  async years() {
    const snap = await getDoc(walletDoc());
    const set = new Set(snap.data()?.years || []);
    set.add(new Date().getFullYear());
    return [...set].sort((a, b) => b - a);
  },

  async year(year) {
    const [exp, metas] = await Promise.all([
      getDocs(query(expensesCol(), where('year', '==', year))),
      getDocs(query(monthsCol(), where(documentId(), '>=', `${year}-01`), where(documentId(), '<=', `${year}-12`))),
    ]);
    const all = exp.docs.map((d) => d.data());
    const metaBy = Object.fromEntries(metas.docs.map((d) => [d.id, d.data()]));
    const months = Array.from({ length: 12 }, (_, i) =>
      computeMonth(year, i + 1, all.filter((e) => e.month === i + 1), metaBy[monthKey(year, i + 1)]));
    const sum = (f) => round(months.reduce((s, m) => s + f(m), 0));
    const byCategory = {};
    for (const m of months) for (const [c, v] of Object.entries(m.byCategory)) byCategory[c] = round((byCategory[c] || 0) + v);
    const total = sum((m) => m.total), income = sum((m) => m.meta.income);
    return { year, months, total, spent: sum((m) => m.spent), fixed: sum((m) => m.meta.fixed), income, saving: round(income - total), byCategory };
  },

  async month(year, month) {
    const [exp, meta] = await Promise.all([
      getDocs(query(expensesCol(), where('year', '==', year), where('month', '==', month))),
      getDoc(doc(monthsCol(), monthKey(year, month))),
    ]);
    const expenses = exp.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.day || 0) - (a.day || 0) || (b.createdAt || 0) - (a.createdAt || 0));
    return { ...computeMonth(year, month, expenses, meta.data()), expenses };
  },

  async saveMonth(year, month, data) {
    const m = { ...DEFAULT_MONTH };
    for (const k of Object.keys(DEFAULT_MONTH)) {
      if (data[k] !== undefined) m[k] = k === 'note' ? String(data[k] ?? '') : Number(data[k]) || 0;
    }
    await setDoc(doc(monthsCol(), monthKey(year, month)), m);
    await updateDoc(walletDoc(), { years: arrayUnion(year) });
  },

  async categories() {
    const snap = await getDoc(walletDoc());
    return snap.data()?.categories || DEFAULT_CATEGORIES;
  },

  async addExpense(e) {
    const item = { ...clean(e), createdAt: Date.now() };
    const ref = await addDoc(expensesCol(), item);
    await remember(item);
    return { id: ref.id, ...item };
  },

  async updateExpense(id, e) {
    const item = clean(e);
    await updateDoc(doc(expensesCol(), id), item);
    await remember(item);
    return { id, ...item };
  },

  deleteExpense: (id) => deleteDoc(doc(expensesCol(), id)),
};
