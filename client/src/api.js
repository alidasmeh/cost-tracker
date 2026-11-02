// Data layer: talks to Firestore directly (no backend). Same interface the pages used before.
//   users/{uid}                  { categories: string[], years: number[] }
//   users/{uid}/expenses/{id}    { year, month, day, title, amount, category, note, createdAt }
//   users/{uid}/months/{YYYY-MM} { fixed, income, prediction, dailyBudget, note }
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, documentId, arrayUnion,
} from 'firebase/firestore';
import { auth, db } from './firebase.js';

export const DEFAULT_CATEGORIES = ['food', 'groceries', 'snack', 'necessities', 'for home', 'clothes',
  'health', 'transportation', 'travel', 'gym', 'others'];
const DEFAULT_MONTH = { fixed: 0, income: 0, prediction: 3000, dailyBudget: 50, note: '' };
const monthKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
const round = (n) => Math.round(n * 100) / 100;

const uid = () => { const u = auth.currentUser?.uid; if (!u) throw new Error('Please sign in'); return u; };
const userDoc = () => doc(db, 'users', uid());
const expensesCol = () => collection(db, 'users', uid(), 'expenses');
const monthsCol = () => collection(db, 'users', uid(), 'months');

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

const remember = (e) => setDoc(userDoc(), { categories: arrayUnion(e.category), years: arrayUnion(e.year) }, { merge: true });

export const api = {
  async years() {
    const snap = await getDoc(userDoc());
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
    await setDoc(userDoc(), { years: arrayUnion(year) }, { merge: true });
  },

  async categories() {
    const snap = await getDoc(userDoc());
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
