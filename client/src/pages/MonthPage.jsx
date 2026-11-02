import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, LinearProgress, Alert, Stack, IconButton, List, ListItemButton,
  ListItemAvatar, Avatar, ListItemText, ListSubheader, Chip, TextField, InputAdornment, Snackbar, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableRow, Button,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Tune';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import { PieChart } from '@mui/x-charts/PieChart';
import Layout from '../components/Layout.jsx';
import CategoryIcon from '../components/CategoryIcon.jsx';
import ExpenseDialog from '../components/ExpenseDialog.jsx';
import MonthSettingsDialog from '../components/MonthSettingsDialog.jsx';
import { api } from '../api.js';
import { MONTHS, eur, catColor } from '../util.js';

export default function MonthPage() {
  const year = Number(useParams().year);
  const month = Number(useParams().month);
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, expense = edit
  const [settings, setSettings] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState(0);

  const load = useCallback(() => api.month(year, month).then(setData).catch((e) => setError(e.message)), [year, month]);
  useEffect(() => { setData(null); setCat(null); load(); }, [load]);
  useEffect(() => { api.categories().then(setCategories).catch(() => {}); }, []);
  useEffect(() => { if (params.get('add')) { setEditing({}); setParams({}, { replace: true }); } }, [params, setParams]);

  const go = (d) => {
    let m = month + d, y = year;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    nav(`/${y}/${m}`);
  };

  const cats = data ? Object.keys(data.byCategory).sort((a, b) => data.byCategory[b] - data.byCategory[a]) : [];
  const groups = useMemo(() => {
    if (!data) return [];
    const ql = q.trim().toLowerCase();
    const items = data.expenses.filter((e) => (!cat || e.category === cat) && (!ql || e.title.toLowerCase().includes(ql) || e.note?.toLowerCase().includes(ql)));
    const map = new Map();
    for (const e of items) { const k = e.day ?? 0; if (!map.has(k)) map.set(k, []); map.get(k).push(e); }
    return [...map.entries()].map(([day, list]) => ({ day, list, sum: list.reduce((s, e) => s + e.amount, 0) }));
  }, [data, q, cat]);

  const save = async (e) => {
    if (e.id) await api.updateExpense(e.id, e); else await api.addExpense(e);
    setToast(e.id ? 'Expense updated' : 'Expense added');
    if (e.year !== year || e.month !== month) nav(`/${e.year}/${e.month}`); else load();
    api.categories().then(setCategories);
  };
  const remove = async (e) => { await api.deleteExpense(e.id); setToast('Expense deleted'); load(); };
  const weekday = (d) => new Date(year, month - 1, d).toLocaleDateString('en-GB', { weekday: 'short' });

  return (
    <Layout title={`${MONTHS[month - 1]} ${year}`} year={year} month={month} onAdd={() => setEditing({})}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <IconButton onClick={() => go(-1)} aria-label="Previous month"><ChevronLeft /></IconButton>
        <Typography variant="subtitle1" fontWeight={600}>{MONTHS[month - 1]} {year}</Typography>
        <IconButton onClick={() => go(1)} aria-label="Next month"><ChevronRight /></IconButton>
      </Box>
      {!data ? <LinearProgress /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
            <Button size="small" color="inherit" startIcon={<SettingsIcon />} onClick={() => setSettings(true)}
              sx={{ textTransform: 'none', color: 'text.secondary' }}>Month setup</Button>
          </Box>
          <TableContainer component={Card}>
            <Table size="small">
              <TableBody>
                {[
                  { label: 'Monthly total', value: data.total, sub: `incl. ${eur(data.meta.fixed)} subs & ins.` },
                  { label: 'Remained from income', value: data.remained, auto: true, sub: `income ${eur(data.meta.income)}` },
                  { label: 'vs. prediction', value: data.deviation, auto: true, sub: `plan ${eur(data.meta.prediction)}` },
                ].map((r) => (
                  <TableRow key={r.label} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ color: 'text.secondary' }}>{r.label}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap',
                      color: r.auto ? (r.value < 0 ? 'error.main' : 'success.main') : 'text.primary' }}>{eur(r.value)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{r.sub}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
          {data.meta.note && <Alert severity="info">{data.meta.note}</Alert>}

          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
            <Tab label={`Expenses (${data.count})`} /><Tab label="Categories" />
          </Tabs>

          {tab === 0 && (<>
            <TextField size="small" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
              {cats.map((c) => (
                <Chip key={c} label={c} onClick={() => setCat(cat === c ? null : c)}
                  color={cat === c ? 'primary' : 'default'} variant={cat === c ? 'filled' : 'outlined'}
                  icon={<CategoryIcon category={c} fontSize="small" />} />
              ))}
            </Box>
            <Card>
              {groups.length === 0 && <CardContent><Typography color="text.secondary">No expenses yet. Tap + to add one.</Typography></CardContent>}
              <List disablePadding>
                {groups.map((g) => (
                  <li key={g.day}>
                    <ul style={{ padding: 0 }}>
                      <ListSubheader sx={{ display: 'flex', justifyContent: 'space-between', lineHeight: '36px' }}>
                        <span>{g.day ? `${weekday(g.day)} ${g.day}` : 'No date'}</span><span>{eur(g.sum)}</span>
                      </ListSubheader>
                      {g.list.map((e) => (
                        <ListItemButton key={e.id} onClick={() => setEditing(e)}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: catColor(e.category, cats), width: 36, height: 36 }}>
                              <CategoryIcon category={e.category} fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={e.title} secondary={e.note ? `${e.category} · ${e.note}` : e.category}
                            primaryTypographyProps={{ noWrap: true }} secondaryTypographyProps={{ noWrap: true }} />
                          <Typography fontWeight={600} sx={{ ml: 1, whiteSpace: 'nowrap' }}>{eur(e.amount)}</Typography>
                        </ListItemButton>
                      ))}
                    </ul>
                  </li>
                ))}
              </List>
            </Card>
          </>)}

          {tab === 1 && (
            <Card><CardContent>
              {cats.length === 0 ? <Typography color="text.secondary">No data.</Typography> : (<>
                <PieChart height={220} slotProps={{ legend: { hidden: true } }}
                  series={[{ innerRadius: 50, paddingAngle: 1, cornerRadius: 4, valueFormatter: (v) => eur(v.value),
                    data: cats.map((c) => ({ id: c, value: data.byCategory[c], label: c, color: catColor(c, cats) })) }]} />
                <List dense>
                  {cats.map((c) => (
                    <ListItemButton key={c} onClick={() => { setCat(c); setTab(0); }}>
                      <ListItemAvatar><Avatar sx={{ bgcolor: catColor(c, cats), width: 32, height: 32 }}><CategoryIcon category={c} fontSize="small" /></Avatar></ListItemAvatar>
                      <ListItemText primary={c} secondary={`${Math.round((data.byCategory[c] / data.spent) * 100)}%`} />
                      <Typography fontWeight={600}>{eur(data.byCategory[c])}</Typography>
                    </ListItemButton>
                  ))}
                </List>
              </>)}
            </CardContent></Card>
          )}
        </Box>
      )}

      <ExpenseDialog open={editing !== null} expense={editing?.id ? editing : null} onClose={() => setEditing(null)}
        onSave={save} onDelete={remove} year={year} month={month} categories={categories} />
      <MonthSettingsDialog open={settings} onClose={() => setSettings(false)} meta={data?.meta}
        onSave={async (m) => { await api.saveMonth(year, month, m); load(); }} />
      <Snackbar open={!!toast} autoHideDuration={2000} onClose={() => setToast('')} message={toast}
        sx={{ bottom: { xs: 'calc(80px + env(safe-area-inset-bottom))' } }} />
    </Layout>
  );
}
