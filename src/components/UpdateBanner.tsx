import { Alert, Button, Stack, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/AppContext';

export default function UpdateBanner() {
  const { t } = useTranslation();
  const { updateState, installUpdate } = useAppStore();
  if (!updateState) return null;
  if (updateState.type === 'downloading') {
    return (
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Alert severity="info">Downloading update...</Alert>
        <LinearProgress variant="determinate" value={updateState.progress?.percent || 0} />
      </Stack>
    );
  }
  if (updateState.type === 'downloaded') {
    return (
      <Alert severity="success" action={<Button color="inherit" size="small" onClick={installUpdate}>{t('installNow')}</Button>}>
        {t('updateAvailable')}
      </Alert>
    );
  }
  return null;
}