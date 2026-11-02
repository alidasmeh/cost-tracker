import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, InputAdornment, Stack, useMediaQuery, useTheme } from '@mui/material';

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

export default function ExpenseDialog({ open, onClose, onSave, onDelete, expense, year, month, categories }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const today = new Date();
  const todayIso = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [f, setF] = useState({});
  const [err, setErr] = useState('');
  useEffect(() => {
    if (open) {
      setErr('');
      setF(expense ? { ...expense, amount: String(expense.amount), date: isoDate(expense.year, expense.month, expense.day ?? 1) }
        : { title: '', amount: '', category: 'groceries', date: todayIso, note: '' });
    }
  }, [open, expense]); // eslint-disable-line

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const [y, m, d] = f.date.split('-').map(Number);
    const { date, ...rest } = f;
    try { await onSave({ ...rest, amount: String(f.amount).replace(',', '.'), year: y, month: m, day: d }); onClose(); }
    catch (x) { setErr(x.message); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>{expense ? 'Edit expense' : 'New expense'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Amount" value={f.amount ?? ''} onChange={set('amount')} required autoFocus
            inputProps={{ inputMode: 'decimal', pattern: '[0-9]+([.,][0-9]{1,2})?' }}
            InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} />
          <TextField label="Title" value={f.title ?? ''} onChange={set('title')} required />
          <Autocomplete freeSolo options={categories} value={f.category ?? ''}
            onChange={(_, v) => setF({ ...f, category: v || '' })}
            onInputChange={(_, v) => setF((p) => ({ ...p, category: v }))}
            renderInput={(p) => <TextField {...p} label="Category" required />} />
          <TextField label="Date" type="date" value={f.date ?? ''} onChange={set('date')} required
            InputLabelProps={{ shrink: true }} />
          <TextField label="Note" value={f.note ?? ''} onChange={set('note')} multiline minRows={2} />
          {err && <TextField error value={err} InputProps={{ readOnly: true }} variant="standard" />}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {expense && <Button color="error" onClick={async () => { await onDelete(expense); onClose(); }} sx={{ mr: 'auto' }}>Delete</Button>}
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
