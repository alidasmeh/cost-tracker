import { useState } from 'react';
import {
  Card, CardContent, Typography, Avatar, Stack, Button, List, ListItem, ListItemButton, ListItemText, IconButton,
  TextField, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Snackbar, Menu, MenuItem, ListItemIcon,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Layout from '../components/Layout.jsx';
import { auth, logOut } from '../firebase.js';
import { api } from '../api.js';
import { useWallet } from '../wallet.js';

function WalletDialog({ mode, onClose, onDone }) {
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const join = mode === 'join';
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { onDone(join ? await api.joinWallet(value) : (await api.createWallet(value)).id); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open={!!mode} onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}
      TransitionProps={{ onExited: () => { setValue(''); setErr(''); } }}>
      <DialogTitle>{join ? 'Join a wallet' : 'New wallet'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {join
            ? <TextField label="Wallet code" value={value} required autoFocus placeholder="e.g. K7Q2MX"
                onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                inputProps={{ autoCapitalize: 'characters', style: { fontFamily: 'monospace', letterSpacing: 4 } }}
                helperText="Ask the wallet's owner for its 6-character code" />
            : <TextField label="Name" value={value} required autoFocus placeholder="e.g. Job"
                onChange={(e) => setValue(e.target.value)} inputProps={{ maxLength: 40 }} />}
          {err && <Alert severity="error">{err}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={busy}>{join ? 'Join' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AccountPage() {
  const user = auth.currentUser;
  const name = user?.displayName || user?.email || 'Signed in';
  const { wallets, current, defaultId, select, setDefault, reload } = useWallet();
  const [dialog, setDialog] = useState(null); // 'create' | 'join'
  const [menu, setMenu] = useState(null); // { anchor, wallet }
  const [toast, setToast] = useState('');

  const copy = async (code) => {
    try { await navigator.clipboard.writeText(code); setToast(`Copied ${code}`); } catch { setToast(code); }
  };
  const leave = async (w) => {
    if (!confirm(`Leave "${w.name}"? You'll need its code to join again.`)) return;
    await api.leaveWallet(w.id); setToast(`Left ${w.name}`); reload();
  };
  const makeDefault = async (w) => { await setDefault(w.id); setToast(`The app now opens on ${w.name}`); };
  const done = async (id) => { setDialog(null); await reload(); select(id); };

  return (
    <Layout title="Account" year={new Date().getFullYear()} tab="account">
      <Stack spacing={2}>
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

        <Card><CardContent>
          <Typography variant="subtitle1" fontWeight={600}>Wallets</Typography>
          <Typography variant="body2" color="text.secondary">
            Share a wallet's code with someone so they can join it and add expenses too.
            The app opens on your default wallet; set it from the ⋮ menu.
          </Typography>
          <List disablePadding sx={{ mt: 1 }}>
            {wallets.map((w) => (
              <ListItem key={w.id} disablePadding secondaryAction={
                <IconButton edge="end" aria-label={`${w.name} options`} onClick={(e) => setMenu({ anchor: e.currentTarget, wallet: w })}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>}>
                <ListItemButton selected={w.id === current.id} onClick={() => select(w.id)} sx={{ borderRadius: 2, pr: 6 }}>
                  <ListItemText
                    primary={<Stack direction="row" spacing={1} alignItems="center" component="span">
                      <span>{w.name}</span>
                      {w.id === defaultId && <Chip label="Default" size="small" variant="outlined" />}
                      {w.id === current.id && <Chip label="In use" size="small" color="primary" />}
                    </Stack>}
                    secondary={<>
                      <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>{w.id}</Typography>
                      {` · ${w.members.length} ${w.members.length === 1 ? 'member' : 'members'}`}
                    </>} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            {menu && [
              <MenuItem key="default" disabled={menu.wallet.id === defaultId}
                onClick={() => { makeDefault(menu.wallet); setMenu(null); }}>
                <ListItemIcon>{menu.wallet.id === defaultId ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}</ListItemIcon>
                {menu.wallet.id === defaultId ? 'Default wallet' : 'Make default'}
              </MenuItem>,
              <MenuItem key="copy" onClick={() => { copy(menu.wallet.id); setMenu(null); }}>
                <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>Copy code
              </MenuItem>,
              !menu.wallet.home && (
                <MenuItem key="leave" onClick={() => { leave(menu.wallet); setMenu(null); }} sx={{ color: 'error.main' }}>
                  <ListItemIcon><ExitToAppIcon fontSize="small" color="error" /></ListItemIcon>Leave wallet
                </MenuItem>),
            ]}
          </Menu>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setDialog('create')}
              sx={{ flex: 1, whiteSpace: 'nowrap' }}>New wallet</Button>
            <Button size="small" variant="outlined" startIcon={<GroupAddIcon />} onClick={() => setDialog('join')}
              sx={{ flex: 1, whiteSpace: 'nowrap' }}>Join with code</Button>
          </Stack>
        </CardContent></Card>
      </Stack>

      <WalletDialog mode={dialog} onClose={() => setDialog(null)} onDone={done} />
      <Snackbar open={!!toast} autoHideDuration={2000} onClose={() => setToast('')} message={toast}
        sx={{ bottom: { xs: 'calc(80px + env(safe-area-inset-bottom))' } }} />
    </Layout>
  );
}
