import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Box, Button, CircularProgress, Typography, Alert } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { auth, signIn, useEmulators } from './firebase.js';
import YearPage from './pages/YearPage.jsx';
import MonthPage from './pages/MonthPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import { api, setWallet } from './api.js';
import { WalletContext } from './wallet.js';

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
const Loading = ({ text }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: '100vh' }}>
    <CircularProgress />{text && <Typography color="text.secondary">{text}</Typography>}
  </Box>
);

// The app opens on the user's default wallet; picking another one lasts until the app is reopened.
function Wallets({ children }) {
  const [data, setData] = useState(null); // { wallets, defaultId }
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => api.wallets().then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => { reload(); }, [reload]);

  const wallets = data?.wallets;
  // Falls back to the default when nothing is picked yet or the picked wallet was just left.
  const active = wallets && (wallets.find((w) => w.id === current) || wallets.find((w) => w.id === data.defaultId) || wallets[0]);
  if (active) setWallet(active.id);
  const value = useMemo(() => ({
    wallets, current: active, defaultId: data?.defaultId, reload, select: setCurrent,
    setDefault: async (id) => { await api.setDefaultWallet(id); await reload(); },
  }), [wallets, active, data, reload]);

  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  if (!active) return <Loading text="Loading wallets…" />;
  return <WalletContext.Provider value={value}>{children(active)}</WalletContext.Provider>;
}

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <Loading />;
  if (!user) return <Login />;
  // Keyed by user and wallet so every page reloads its data on a switch.
  return <Wallets key={user.uid}>{(wallet) => (
    <Routes key={wallet.id}>
      <Route path="/" element={<Navigate to={`/${now.getFullYear()}/${now.getMonth() + 1}`} replace />} />
      <Route path="/account" element={<AccountPage />} />
      {/* Home-screen shortcut: open this month with the add dialog */}
      <Route path="/add" element={<Navigate to={`/${now.getFullYear()}/${now.getMonth() + 1}?add=1`} replace />} />
      <Route path="/:year" element={<YearPage />} />
      <Route path="/:year/:month" element={<MonthPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )}</Wallets>;
}
