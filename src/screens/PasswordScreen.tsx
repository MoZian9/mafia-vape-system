import { useEffect, useState } from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/AppContext';

export default function PasswordScreen() {
  const { t } = useTranslation();
  const { settings, saveOwnerEmail, saveOwnerCredentials, sendResetEmail } = useAppStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState(settings?.adminEmail || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setEmail(settings?.adminEmail || '');
  }, [settings?.adminEmail]);

  const flash = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 10000);
  };

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">{t('password')}</Typography>
        <Stack spacing={2} mt={2}>
          <TextField fullWidth label={t('adminEmail')} value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField fullWidth type="password" label={t('newPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <TextField fullWidth type="password" label={t('confirmPassword')} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={async () => {
              try {
                if (!email.trim()) return flash('error', 'Admin email is required');
                if (!newPassword.trim()) {
                  await saveOwnerEmail(email.trim());
                  return flash('success', t('save'));
                }
                if (newPassword !== confirm) return flash('error', 'Passwords do not match');
                await saveOwnerCredentials(email.trim(), newPassword.trim());
                setNewPassword('');
                setConfirm('');
                flash('success', t('passwordChanged'));
              } catch (error: any) {
                flash('error', error?.message || 'Failed');
              }
            }}>{t('save')}</Button>
            <Button variant="outlined" onClick={async () => {
              try {
                if (!email.trim()) return flash('error', 'Admin email is required');
                await sendResetEmail(email.trim());
                flash('success', t('resetSent'));
              } catch (error: any) {
                flash('error', error?.message || 'Failed');
              }
            }}>{t('resetByEmail')}</Button>
          </Stack>
          {message && <Alert severity={message.type}>{message.text}</Alert>}
        </Stack>
      </Paper>
    </Stack>
  );
}
