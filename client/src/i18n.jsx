// Tiny i18n layer: English + German. The chosen language is saved on the account (users/{uid}.language) and cached
// in localStorage so the app starts in it before sign-in; without either it follows the browser language. Categories stay stored in English; only their labels are translated.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export const LANGUAGES = [{ code: 'en', name: 'English' }, { code: 'de', name: 'Deutsch' }];
const LOCALES = { en: 'en-GB', de: 'de-DE' };

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
};

// Default categories (stored keys) → German labels. Custom categories are shown as typed.
const CATEGORIES_DE = {
  food: 'Essen', groceries: 'Lebensmittel', snack: 'Snacks', necessities: 'Notwendiges', 'for home': 'Fürs Zuhause',
  clothes: 'Kleidung', health: 'Gesundheit', transportation: 'Verkehr', travel: 'Reisen', gym: 'Fitnessstudio',
  others: 'Sonstiges',
};

const de = {
  'Cost Tracker': 'Kostentracker',
  'Sign in with Google': 'Mit Google anmelden',
  'Local mode (Firebase emulators). Pick or create any test account in the popup.':
    'Lokaler Modus (Firebase-Emulatoren). Wähle im Popup ein Testkonto oder lege eines an.',
  "{email} couldn't load its wallets. Sign out and sign in again.":
    '{email} konnte die Geldbörsen nicht laden. Melde dich ab und wieder an.',
  'This account': 'Dieses Konto',
  'Sign out': 'Abmelden',
  'Loading wallets…': 'Geldbörsen werden geladen…',
  'Something went wrong': 'Etwas ist schiefgelaufen',

  // Layout
  Year: 'Jahr', Month: 'Monat', Account: 'Konto', 'Add expense': 'Ausgabe hinzufügen', Wallet: 'Geldbörse',

  // Account
  'Logged in as': 'Angemeldet als',
  'Signed in': 'Angemeldet',
  Language: 'Sprache',
  Wallets: 'Geldbörsen',
  "Share a wallet's code with someone so they can join it and add expenses too. The app opens on your default wallet; set it from the ⋮ menu.":
    'Teile den Code einer Geldbörse, damit andere beitreten und ebenfalls Ausgaben eintragen können. Die App öffnet deine Standard-Geldbörse; festlegen kannst du sie im ⋮-Menü.',
  Default: 'Standard',
  'In use': 'Aktiv',
  member: 'Mitglied',
  members: 'Mitglieder',
  'Default wallet': 'Standard-Geldbörse',
  'Make default': 'Als Standard festlegen',
  'Copy code': 'Code kopieren',
  'Leave wallet': 'Geldbörse verlassen',
  'New wallet': 'Neue Geldbörse',
  'Join with code': 'Mit Code beitreten',
  'Join a wallet': 'Einer Geldbörse beitreten',
  'Wallet code': 'Geldbörsen-Code',
  'e.g. K7Q2MX': 'z. B. K7Q2MX',
  "Ask the wallet's owner for its 6-character code": 'Frag die Besitzerin oder den Besitzer nach dem 6-stelligen Code',
  Name: 'Name',
  'e.g. Job': 'z. B. Arbeit',
  Cancel: 'Abbrechen',
  Join: 'Beitreten',
  Create: 'Erstellen',
  'Copied {code}': '{code} kopiert',
  'Leave "{name}"? You\'ll need its code to join again.': '„{name}“ verlassen? Zum erneuten Beitreten brauchst du den Code.',
  'Left {name}': '{name} verlassen',
  'The app now opens on {name}': 'Die App öffnet jetzt {name}',
  '{name} options': 'Optionen für {name}',

  // Month
  'Expense updated': 'Ausgabe aktualisiert',
  'Expense added': 'Ausgabe hinzugefügt',
  'Expense deleted': 'Ausgabe gelöscht',
  'Previous month': 'Vorheriger Monat',
  'Next month': 'Nächster Monat',
  'Month setup': 'Monat einrichten',
  'Monthly total': 'Monatssumme',
  'incl. {amount} subs & ins.': 'inkl. {amount} Abos & Vers.',
  'Remained from income': 'Vom Einkommen übrig',
  'income {amount}': 'Einkommen {amount}',
  'vs. prediction': 'ggü. Planung',
  'plan {amount}': 'Plan {amount}',
  'Expenses ({count})': 'Ausgaben ({count})',
  Categories: 'Kategorien',
  Search: 'Suchen',
  'No expenses yet. Tap + to add one.': 'Noch keine Ausgaben. Tippe auf +, um eine hinzuzufügen.',
  'No date': 'Ohne Datum',
  'No data.': 'Keine Daten.',

  // Year
  'Total cost': 'Gesamtkosten',
  'Total income': 'Gesamteinkommen',
  Saving: 'Ersparnis',
  'Subs & insurance': 'Abos & Versicherungen',
  'Monthly cost vs income': 'Monatliche Kosten vs. Einkommen',
  Cost: 'Kosten',
  Income: 'Einkommen',
  Months: 'Monate',
  Remained: 'Übrig',
  'By category': 'Nach Kategorie',

  // Expense dialog
  'Edit expense': 'Ausgabe bearbeiten',
  'New expense': 'Neue Ausgabe',
  Amount: 'Betrag',
  Title: 'Titel',
  Category: 'Kategorie',
  Date: 'Datum',
  Note: 'Notiz',
  Delete: 'Löschen',
  'Saving…': 'Speichern…',
  Save: 'Speichern',

  // Month settings
  'Month Setup': 'Monat einrichten',
  'Subscriptions & insurance': 'Abos & Versicherungen',
  'Planned spending (prediction)': 'Geplante Ausgaben (Prognose)',
  'Max daily (non-necessities)': 'Max. pro Tag (ohne Notwendiges)',

  // api.js errors
  'Please sign in': 'Bitte melde dich an',
  'No wallet selected': 'Keine Geldbörse ausgewählt',
  'Title is required': 'Titel ist erforderlich',
  'Amount must be a number': 'Betrag muss eine Zahl sein',
  'Category is required': 'Kategorie ist erforderlich',
  'Invalid day': 'Ungültiger Tag',
  'Wallet name is required': 'Name der Geldbörse ist erforderlich',
  'A wallet code is 6 letters and digits': 'Ein Geldbörsen-Code besteht aus 6 Buchstaben und Ziffern',
  'No wallet with that code': 'Keine Geldbörse mit diesem Code',
};
const DICTS = { en: {}, de };

const STORAGE_KEY = 'lang';
function initialLang() {
  try { const s = localStorage.getItem(STORAGE_KEY); if (DICTS[s]) return s; } catch { /* storage blocked */ }
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

// Module-level so non-React code (api.js errors) can translate too.
let lang = initialLang();
document.documentElement.lang = lang;

export function t(key, vars) {
  let s = DICTS[lang][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
export const catLabel = (c) => (lang === 'de' && CATEGORIES_DE[c]) || c;
// Turns what the user typed/picked (maybe a German label) back into the stored category key.
export function catKey(label) {
  const l = String(label ?? '').trim().toLowerCase();
  const hit = Object.entries(CATEGORIES_DE).find(([, v]) => v.toLowerCase() === l);
  return hit ? hit[0] : l;
}

const I18nContext = createContext(null);
export function I18nProvider({ children }) {
  const [current, setCurrent] = useState(lang);
  const setLang = useCallback((l) => {
    if (!DICTS[l]) return;
    lang = l; setCurrent(l); document.documentElement.lang = l;
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* storage blocked */ }
  }, []);
  const value = useMemo(() => ({
    lang: current, t, catLabel, catKey,
    months: MONTHS[current], locale: LOCALES[current],
    setLang,
  }), [current, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export const useI18n = () => useContext(I18nContext);
