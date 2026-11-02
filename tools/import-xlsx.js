// Imports a one-year workbook (Summary sheet + one sheet per month) into Firestore for one user.
//
//   cd tools
//   GOOGLE_APPLICATION_CREDENTIALS=service-account.json npm run import -- "../../Costs - 2026.xlsx" you@example.com [year]
//   Local emulators instead: from the app folder, npm run import:local -- "../../Costs - 2026.xlsx" you@example.com
//
// Sign in to the app once first so the user exists. Re-running replaces that year's data only.
import XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();
const userRef = (uid) => db.collection('users').doc(uid);
const expensesCol = (uid) => userRef(uid).collection('expenses');
const monthsCol = (uid) => userRef(uid).collection('months');
const monthKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
const DEFAULT_CATEGORIES = ['food', 'groceries', 'snack', 'necessities', 'for home', 'clothes', 'health', 'transportation', 'travel', 'gym', 'others'];
const getCategories = async (uid) => (await userRef(uid).get()).data()?.categories || DEFAULT_CATEGORIES;

const [file, email, yearArg] = process.argv.slice(2);
if (!file || !email || !fs.existsSync(file)) { console.error('Usage: npm run import -- <file.xlsx> <email> [year]'); process.exit(1); }
const year = Number(yearArg) || Number(path.basename(file).match(/(20\d\d)/)?.[1]) || new Date().getFullYear();

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthOf = (name) => { const i = MONTHS.findIndex((m) => name.trim().toLowerCase().startsWith(m)); return i < 0 ? null : i + 1; };
const num = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = Number(v.replace(',', '.').trim()); return Number.isFinite(n) ? n : null; }
  return null;
};

const uid = (await getAuth().getUserByEmail(email)).uid;
const wb = XLSX.read(fs.readFileSync(file));

// Collect
const expenses = [];
const categories = new Set(await getCategories(uid));
for (const name of wb.SheetNames) {
  const month = monthOf(name);
  if (!month || /template/i.test(name)) continue;
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, range: 'A2:D2000', raw: true });
  for (const [title, amount, category, day] of rows) {
    const a = num(amount);
    if ((title == null || title === '') && a == null) continue;
    if (a == null) { console.warn(`  skipped (${name}): "${title}" amount=${amount}`); continue; }
    const cat = String(category || 'others').trim().toLowerCase() || 'others';
    categories.add(cat);
    expenses.push({ year, month, day: num(day) ? Math.round(num(day)) : null, title: String(title ?? '').trim() || '(untitled)',
      amount: a, category: cat, note: '', createdAt: Date.now() + expenses.length });
  }
}
const months = {};
if (wb.Sheets.Summary) {
  for (const r of XLSX.utils.sheet_to_json(wb.Sheets.Summary, { header: 1, raw: true }).slice(1, 13)) {
    const month = monthOf(String(r[0] || ''));
    if (month) months[monthKey(year, month)] = { fixed: num(r[1]) || 0, prediction: num(r[7]) ?? 3000,
      income: num(r[8]) || 0, dailyBudget: 50, note: r[10] ? String(r[10]) : '' };
  }
}

// Write (BulkWriter batches & retries)
const w = db.bulkWriter();
for (const d of (await expensesCol(uid).where('year', '==', year).get()).docs) w.delete(d.ref);
for (const k of Object.keys(months)) w.set(monthsCol(uid).doc(k), months[k]);
for (const e of expenses) w.create(expensesCol(uid).doc(), e);
w.set(userRef(uid), { categories: [...categories], years: FieldValue.arrayUnion(year) }, { merge: true });
await w.close();
console.log(`Imported ${expenses.length} expenses and ${Object.keys(months).length} months for ${year} → ${email}`);
