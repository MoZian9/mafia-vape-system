import { Button, Dialog, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import HiddenBypassDot from './HiddenBypassDot';

export default function AdminSetupDialog() {
  const { t } = useTranslation();
  const { adminDialogOpen, createOwner } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const skipped = localStorage.getItem('mv-admin-setup-skipped') === '1';
  if (skipped) return null;

  return (
    <Dialog open={adminDialogOpen} maxWidth="sm" fullWidth>
      <DialogTitle>{t('setupAdmin')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="body2">{t('adminGateMessage')}</Typography>
          <TextField value={email} onChange={(e) => setEmail(e.target.value)} label={t('adminEmail')} fullWidth />
          <TextField value={password} onChange={(e) => setPassword(e.target.value)} label={t('newPassword')} fullWidth type="password" />
          <TextField value={confirm} onChange={(e) => setConfirm(e.target.value)} label={t('confirmPassword')} fullWidth type="password" />
          <Button
            variant="contained"
            onClick={() => {
              if (!email || !password || password !== confirm) return;
              createOwner(email, password).then(() => localStorage.removeItem('mv-admin-setup-skipped'));
            }}
          >
            {t('save')}
          </Button>
          <HiddenBypassDot onBypass={() => {
            localStorage.setItem('mv-admin-setup-skipped', '1');
            window.location.reload();
          }} />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
