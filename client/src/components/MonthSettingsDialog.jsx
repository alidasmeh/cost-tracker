import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, InputAdornment } from '@mui/material';

const FIELDS = [
  ['income', 'Income'], ['fixed', 'Subscriptions & insurance'],
  ['prediction', 'Planned spending (prediction)'], ['dailyBudget', 'Max daily (non-necessities)'],
];
export default function MonthSettingsDialog({ open, onClose, meta, onSave }) {
  const [f, setF] = useState(meta || {});
  useEffect(() => { if (open) setF(meta || {}); }, [open, meta]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Month Setup</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {FIELDS.map(([k, l]) => (
            <TextField key={k} label={l} value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value.replace(',', '.') })}
              inputProps={{ inputMode: 'decimal' }} InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} />
          ))}
          <TextField label="Note" value={f.note ?? ''} onChange={(e) => setF({ ...f, note: e.target.value })} multiline />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={async () => { await onSave(f); onClose(); }}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
