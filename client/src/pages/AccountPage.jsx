import { Card, CardContent, Typography, Avatar, Stack, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Layout from '../components/Layout.jsx';
import { auth, logOut } from '../firebase.js';

export default function AccountPage() {
  const user = auth.currentUser;
  const name = user?.displayName || user?.email || 'Signed in';
  return (
    <Layout title="Account" year={new Date().getFullYear()} tab="account">
      <Card><CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={user?.photoURL || undefined} alt={name} sx={{ width: 56, height: 56 }}>{name[0]?.toUpperCase()}</Avatar>
          <Stack sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">Logged in as</Typography>
            <Typography variant="subtitle1" fontWeight={600} noWrap>{name}</Typography>
            {user?.displayName && user?.email && <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>}
          </Stack>
        </Stack>
        <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={logOut} fullWidth sx={{ mt: 3 }}>
          Sign out
        </Button>
      </CardContent></Card>
    </Layout>
  );
}
