import { Card, CardContent, Typography } from '@mui/material';
import { eur } from '../util.js';
export default function StatCard({ label, value, tone, sub }) {
  const color = tone === 'auto' ? (value < 0 ? 'error.main' : 'success.main') : tone || 'text.primary';
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h6" sx={{ color, fontWeight: 600, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>{eur(value)}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  );
}
