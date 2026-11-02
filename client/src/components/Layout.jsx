import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Box, Container, Select, MenuItem, BottomNavigation, BottomNavigationAction, Paper, Fab } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../api.js';
import { logOut } from '../firebase.js';

export default function Layout({ title, year, month, back, actions, onAdd, children }) {
  const nav = useNavigate();
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
          <Select size="small" value={year} variant="standard" disableUnderline
            onChange={(e) => nav(month ? `/${e.target.value}/${month}` : `/${e.target.value}`)}
            sx={{ color: 'inherit', ml: 1, '& .MuiSvgIcon-root': { color: 'inherit' } }}>
            {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            <MenuItem value={Math.max(...years) + 1}>{Math.max(...years) + 1}</MenuItem>
          </Select>
          <IconButton color="inherit" onClick={logOut} aria-label="Sign out" edge="end" sx={{ ml: 0.5 }}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 2 }}>{children}</Container>
      <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, pb: 'env(safe-area-inset-bottom)', zIndex: 10 }}>
        <BottomNavigation showLabels value={month ? 1 : 0}
          onChange={(_, v) => nav(v === 0 ? `/${year}` : `/${year}/${thisMonth}`)}>
          <BottomNavigationAction label="Year" icon={<DateRangeIcon />} />
          <BottomNavigationAction label="Month" icon={<CalendarMonthIcon />} />
        </BottomNavigation>
        {/* Without a month page to handle it, open the add dialog on the current month */}
        <Fab color="secondary" size="medium" aria-label="Add expense"
          onClick={() => (onAdd ? onAdd() : nav(`/${year}/${thisMonth}?add=1`))}
          sx={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)' }}><AddIcon /></Fab>
      </Paper>
    </Box>
  );
}
