import { useEffect, useState } from 'react';
import { useI18n } from '../i18n.jsx';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, InputAdornment, Stack, useMediaQuery, useTheme } from '@mui/material';

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

export default function ExpenseDialog({ open, onClose, onSave, onDelete, expense, year, month, categories }) {
  const { t, catLabel, catKey } = useI18n();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const today = new Date();
  const todayIso = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [f, setF] = useState({});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setErr('');
      setF(expense ? { ...expense, category: catLabel(expense.category), amount: String(expense.amount), date: isoDate(expense.year, expense.month, expense.day ?? 1) }
        : { title: '', amount: '', category: catLabel('groceries'), date: todayIso, note: '' });
    }
  }, [open, expense]); // eslint-disable-line

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const [y, m, d] = f.date.split('-').map(Number);
    const { date, ...rest } = f;
    setSaving(true);
    try { await onSave({ ...rest, category: catKey(f.category), amount: String(f.amount).replace(',', '.'), year: y, month: m, day: d }); onClose(); }
    catch (x) { setErr(x.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="xs" component="form" onSubmit={submit} disableBackdropClick={saving} disableEscapeKeyDown={saving}>
      <DialogTitle>{expense ? t('Edit expense') : t('New expense')}</DialogTitle>
      <DialogContent sx={{ flex: '0 1 auto' }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label={t('Amount')} value={f.amount ?? ''} onChange={set('amount')} required autoFocus
            inputProps={{ inputMode: 'decimal', pattern: '[0-9]+([.,][0-9]{1,2})?' }}
            InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} />
          <TextField label={t('Title')} value={f.title ?? ''} onChange={set('title')} required />
          <Autocomplete freeSolo options={categories.map(catLabel)} value={f.category ?? ''}
            onChange={(_, v) => setF({ ...f, category: v || '' })}
            onInputChange={(_, v) => setF((p) => ({ ...p, category: v }))}
            renderInput={(p) => <TextField {...p} label={t('Category')} required />} />
          <TextField label={t('Date')} type="date" value={f.date ?? ''} onChange={set('date')} required
            InputLabelProps={{ shrink: true }} />
          <TextField label={t('Note')} value={f.note ?? ''} onChange={set('note')} multiline minRows={2} />
          {err && <TextField error value={err} InputProps={{ readOnly: true }} variant="standard" />}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {expense && <Button color="error" disabled={saving} onClick={async () => { await onDelete(expense); onClose(); }} sx={{ mr: 'auto' }}>{t('Delete')}</Button>}
        <Button onClick={onClose} disabled={saving}>{t('Cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>{saving ? t('Saving…') : t('Save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
