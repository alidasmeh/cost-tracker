import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, Box, LinearProgress, Alert, Stack, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, alpha } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import { api } from '../api.js';
import { MONTHS, eur, catColor } from '../util.js';

export default function YearPage() {
  const year = Number(useParams().year);
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { setData(null); api.year(year).then(setData).catch((e) => setError(e.message)); }, [year]);

  const cats = data ? Object.keys(data.byCategory).sort((a, b) => data.byCategory[b] - data.byCategory[a]) : [];
  return (
    <Layout title={`${year}`} year={year}>
      {error && <Alert severity="error">{error}</Alert>}
      {!data ? <LinearProgress /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={6} sm={3}><StatCard label="Total cost" value={data.total} /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Total income" value={data.income} /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Saving" value={data.saving} tone="auto" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Subs & insurance" value={data.fixed} /></Grid>
          </Grid>

          <Card><CardContent>
            <Typography variant="subtitle1" fontWeight={600}>Monthly cost vs income</Typography>
            <BarChart height={240} margin={{ left: 50, right: 10, top: 40, bottom: 25 }}
              xAxis={[{ scaleType: 'band', data: MONTHS.map((m) => m.slice(0, 3)) }]}
              series={[
                { data: data.months.map((m) => m.total), label: 'Cost', color: '#e91e63', valueFormatter: eur },
                { data: data.months.map((m) => m.meta.income), label: 'Income', color: '#3f51b5', valueFormatter: eur },
              ]} />
          </CardContent></Card>

          <Typography variant="subtitle1" fontWeight={600}>Months</Typography>
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Items</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Remained</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.months.map((m) => {
                  const pct = Math.min(100, (m.total / (m.meta.prediction || 1)) * 100);
                  const over = m.total > m.meta.prediction;
                  return (
                    <TableRow key={m.month} hover onClick={() => nav(`/${year}/${m.month}`)}
                      sx={(t) => {
                        const c = alpha(over ? t.palette.error.main : t.palette.primary.main, 0.14);
                        return {
                          cursor: 'pointer', opacity: m.count || m.meta.income ? 1 : 0.6,
                          background: `linear-gradient(to right, ${c} ${pct}%, transparent ${pct}%)`,
                          '&:last-child td': { borderBottom: 0 },
                        };
                      }}>
                      <TableCell sx={{ fontWeight: 600 }}>{MONTHS[m.month - 1]}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>{m.count}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{eur(m.total)}</TableCell>
                      <TableCell align="right" sx={{ color: m.remained < 0 ? 'error.main' : 'success.main' }}>
                        {m.meta.income > 0 ? `${m.remained >= 0 ? '+' : ''}${eur(m.remained)}` : ''}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {cats.length > 0 && (
            <Card><CardContent>
              <Typography variant="subtitle1" fontWeight={600}>By category</Typography>
              <PieChart height={220} slotProps={{ legend: { hidden: true } }}
                series={[{ innerRadius: 50, paddingAngle: 1, cornerRadius: 4, valueFormatter: (v) => eur(v.value),
                  data: cats.map((c) => ({ id: c, value: data.byCategory[c], label: c, color: catColor(c, cats) })) }]} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {cats.map((c) => <Chip key={c} size="small" label={`${c} · ${eur(data.byCategory[c])}`}
                  sx={{ bgcolor: catColor(c, cats), color: '#fff' }} />)}
              </Box>
            </CardContent></Card>
          )}
        </Box>
      )}
    </Layout>
  );
}
