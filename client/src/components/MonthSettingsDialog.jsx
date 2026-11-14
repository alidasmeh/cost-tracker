import { useEffect, useState } from 'react';
import { useI18n } from '../i18n.jsx';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, InputAdornment } from '@mui/material';

const FIELDS = [
  ['income', 'Income'], ['fixed', 'Subscriptions & insurance'],
  ['prediction', 'Planned spending (prediction)'], ['dailyBudget', 'Max daily (non-necessities)'],
];
export default function MonthSettingsDialog({ open, onClose, meta, onSave }) {
  const { t } = useI18n();
  const [f, setF] = useState(meta || {});
  useEffect(() => { if (open) setF(meta || {}); }, [open, meta]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('Month Setup')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {FIELDS.map(([k, l]) => (
            <TextField key={k} label={t(l)} value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value.replace(',', '.') })}
              inputProps={{ inputMode: 'decimal' }} InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} />
          ))}
          <TextField label={t('Note')} value={f.note ?? ''} onChange={(e) => setF({ ...f, note: e.target.value })} multiline />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Cancel')}</Button>
        <Button variant="contained" onClick={async () => { await onSave(f); onClose(); }}>{t('Save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
