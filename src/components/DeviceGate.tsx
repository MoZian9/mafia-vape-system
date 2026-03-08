import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/AppContext';

export default function DeviceGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { device, checkUpdates } = useAppStore();

  if (!device) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '100vh' }} spacing={2}>
        <CircularProgress />
        <Typography>{t('deviceStatus')}</Typography>
      </Stack>
    );
  }

  if (device.status === 'pending') {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '100vh', p: 3 }} spacing={2}>
        <Alert severity="warning">{t('pendingDevice')}</Alert>
        <Typography variant="body2">Device ID: {device.deviceId}</Typography>
        <Button variant="contained" onClick={checkUpdates}>{t('updateChecking')}</Button>
      </Stack>
    );
  }

  if (device.status === 'blocked') {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '100vh', p: 3 }} spacing={2}>
        <Alert severity="error">{t('blockedDevice')}</Alert>
        <Typography variant="body2">{device.blockedReason || 'FRTS'}</Typography>
      </Stack>
    );
  }

  return <Box>{children}</Box>;
}