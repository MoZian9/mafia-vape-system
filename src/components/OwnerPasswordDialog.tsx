import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/AppContext';
import type { PageKey } from './MenuDrawer';
import HiddenBypassDot from './HiddenBypassDot';

interface Props {
  open: boolean;
  page?: PageKey | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OwnerPasswordDialog({ open, page, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { settings, signInOwner } = useAppStore();
  const [password, setPassword] = useState('');

  const allowBypass = page === 'shifts' || page === 'password';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('passwordProtected')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField value={settings?.adminEmail || ''} label={t('adminEmail')} disabled fullWidth />
          <TextField value={password} onChange={(e) => setPassword(e.target.value)} label={t('adminPasswordPrompt')} type="password" fullWidth />
          <Button
            variant="contained"
            onClick={async () => {
              if (!settings?.adminEmail) return;
              await signInOwner(settings.adminEmail, password);
              onSuccess();
              onClose();
              setPassword('');
            }}
          >
            {t('login')}
          </Button>
          {allowBypass && <HiddenBypassDot onBypass={() => {
            onSuccess();
            onClose();
            setPassword('');
          }} />}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
