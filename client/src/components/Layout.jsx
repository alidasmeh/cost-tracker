import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Box, Container, Select, MenuItem, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../api.js';
import { useWallet } from '../wallet.js';

export default function Layout({ title, year, month, back, actions, onAdd, tab, children }) {
  const nav = useNavigate();
  const { wallets, current, select } = useWallet();
  const [years, setYears] = useState([year]);
  useEffect(() => { api.years().then((ys) => setYears(ys.includes(year) ? ys : [year, ...ys])).catch(() => {}); }, [year]);
  const thisMonth = month || new Date().getMonth() + 1;
  return (
    <Box sx={{ pb: 'calc(72px + env(safe-area-inset-bottom))', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          {back && <IconButton edge="start" color="inherit" onClick={() => nav(back)} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>}
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>{title}</Typography>
          {actions}
          <Select size="small" value={current.id} variant="standard" disableUnderline aria-label="Wallet"
            onChange={(e) => select(e.target.value)}
            sx={{ color: 'inherit', ml: 1, maxWidth: 120, '& .MuiSvgIcon-root': { color: 'inherit' } }}>
            {wallets.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </Select>
          <Select size="small" value={year} variant="standard" disableUnderline
            onChange={(e) => nav(month ? `/${e.target.value}/${month}` : `/${e.target.value}`)}
            sx={{ color: 'inherit', ml: 1, '& .MuiSvgIcon-root': { color: 'inherit' } }}>
            {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            <MenuItem value={Math.max(...years) + 1}>{Math.max(...years) + 1}</MenuItem>
          </Select>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 2 }}>{children}</Container>
      <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, pb: 'env(safe-area-inset-bottom)', zIndex: 10 }}>
        <BottomNavigation showLabels value={tab || (month ? 'month' : 'year')}
          onChange={(_, v) => {
            // Without a month page to handle it, open the add dialog on the current month
            if (v === 'add') return onAdd ? onAdd() : nav(`/${year}/${thisMonth}?add=1`);
            nav({ year: `/${year}`, month: `/${year}/${thisMonth}`, account: '/account' }[v]);
          }}>
          <BottomNavigationAction value="year" label="Year" icon={<DateRangeIcon />} />
          <BottomNavigationAction value="month" label="Month" icon={<CalendarMonthIcon />} />
          <BottomNavigationAction value="account" label="Account" icon={<PersonIcon />} />
          <BottomNavigationAction value="add" aria-label="Add expense" icon={
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center',
              bgcolor: 'secondary.main', color: 'secondary.contrastText', boxShadow: 3 }}><AddIcon /></Box>} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
