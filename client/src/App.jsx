import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Box, Button, CircularProgress, Typography, Alert } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { auth, signIn, useEmulators } from './firebase.js';
import YearPage from './pages/YearPage.jsx';
import MonthPage from './pages/MonthPage.jsx';
import AccountPage from './pages/AccountPage.jsx';

function Login() {
  const [err, setErr] = useState('');
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, p: 3 }}>
      <Typography variant="h4" fontWeight={600}>Cost Tracker</Typography>
      <Button variant="contained" size="large" startIcon={<GoogleIcon />} onClick={() => signIn().catch((e) => setErr(e.message))}>
        Sign in with Google
      </Button>
      {useEmulators && <Alert severity="info">Local mode (Firebase emulators). Pick or create any test account in the popup.</Alert>}
      {err && <Alert severity="error">{err}</Alert>}
    </Box>
  );
}

const now = new Date();
export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
  if (!user) return <Login />;
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${now.getFullYear()}/${now.getMonth() + 1}`} replace />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/:year" element={<YearPage />} />
      <Route path="/:year/:month" element={<MonthPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
