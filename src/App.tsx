import { useState } from 'react';
import { Box, Container, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MenuDrawer, { PageKey } from './components/MenuDrawer';
import TitleBar from './components/TitleBar';
import AdminSetupDialog from './components/AdminSetupDialog';
import DeviceGate from './components/DeviceGate';
import UpdateBanner from './components/UpdateBanner';
import OwnerPasswordDialog from './components/OwnerPasswordDialog';
import DashboardScreen from './screens/DashboardScreen';
import InventoryScreen from './screens/InventoryScreen';
import ShiftsScreen from './screens/ShiftsScreen';
import InvoicesScreen from './screens/InvoicesScreen';
import PasswordScreen from './screens/PasswordScreen';
import { useAppStore } from './store/AppContext';

export default function App() {
  const { t } = useTranslation();
  const { version, themeMode, setThemeModeValue, language, setLanguage, device } = useAppStore();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ownerDialogFor, setOwnerDialogFor] = useState<PageKey | null>(null);

  const openPage = (next: PageKey) => {
    if (['inventory', 'shifts', 'password'].includes(next)) setOwnerDialogFor(next);
    else setPage(next);
  };

  return (
    <DeviceGate>
      <Box className="app-shell app-watermark">
        <TitleBar version={version} onMenu={() => setDrawerOpen(true)} />
        <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} page={page} onChange={openPage} />
        <OwnerPasswordDialog
          open={!!ownerDialogFor}
          page={ownerDialogFor}
          onClose={() => setOwnerDialogFor(null)}
          onSuccess={() => {
            if (ownerDialogFor) setPage(ownerDialogFor);
          }}
        />
        <AdminSetupDialog />
        <Container maxWidth={false} sx={{ py: 3, position: 'relative', zIndex: 1, flex: 1, overflow: 'auto' }}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                <Box>
                  <Typography variant="h4">{t('appName')}</Typography>
                  <Typography variant="body2">{t('deviceStatus')}: {device?.status || '...'}</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                  <TextField select size="small" value={themeMode} label={t('theme')} onChange={(e) => setThemeModeValue(e.target.value as any)} sx={{ minWidth: 140 }}>
                    <MenuItem value="dark">{t('dark')}</MenuItem>
                    <MenuItem value="light">{t('light')}</MenuItem>
                  </TextField>
                  <TextField select size="small" value={language} label={t('language')} onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')} sx={{ minWidth: 140 }}>
                    <MenuItem value="ar">العربية</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </TextField>
                </Stack>
              </Stack>
            </Paper>
            <UpdateBanner />
            {page === 'dashboard' && <DashboardScreen />}
            {page === 'inventory' && <InventoryScreen />}
            {page === 'shifts' && <ShiftsScreen />}
            {page === 'invoices' && <InvoicesScreen />}
            {page === 'password' && <PasswordScreen />}
          </Stack>
        </Container>
      </Box>
    </DeviceGate>
  );
}
