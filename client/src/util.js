const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
export const eur = (n) => fmt.format(n || 0);
// Every category keeps the same colour everywhere (all months, year view, charts).
// Default categories get hand-picked, well-separated colours; custom ones get a
// colour derived from their name, so it never depends on sort order or spend.
const FIXED = {
  food: '#e91e63', groceries: '#4caf50', snack: '#ff9800', necessities: '#3f51b5',
  'for home': '#795548', clothes: '#9c27b0', health: '#f44336', transportation: '#03a9f4',
  travel: '#009688', gym: '#cddc39', others: '#607d8b',
};
const PALETTE = ['#673ab7','#00bcd4','#ff5722','#8bc34a','#2196f3','#ffc107','#e040fb','#26a69a',
  '#5c6bc0','#ec407a','#9e9d24','#8d6e63','#00897b','#d81b60','#1e88e5','#fb8c00'];
const hash = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };
export const catColor = (c) => {
  const k = String(c ?? '').trim().toLowerCase();
  return FIXED[k] || PALETTE[hash(k) % PALETTE.length];
};
