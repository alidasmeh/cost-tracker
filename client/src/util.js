export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
export const eur = (n) => fmt.format(n || 0);
const PALETTE = ['#3f51b5','#e91e63','#009688','#ff9800','#9c27b0','#03a9f4','#8bc34a','#795548','#f44336','#607d8b','#cddc39','#00bcd4'];
export const catColor = (c, all) => PALETTE[Math.max(0, all.indexOf(c)) % PALETTE.length];
