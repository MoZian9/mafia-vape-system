import { useState } from 'react';
import { Alert, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/AppContext';

export default function ShiftsScreen() {
  const { t } = useTranslation();
  const { shifts, addShiftName, removeShiftName } = useAppStore();
  const [name, setName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const flash = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 10000);
  };

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>{t('addShift')}</Typography>
        <Stack direction="row" spacing={2}>
          <TextField fullWidth label={t('shiftName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Button variant="contained" onClick={async () => {
            try {
              if (!name.trim()) return;
              await addShiftName(name.trim());
              setName('');
              flash('success', 'تم الحفظ');
            } catch (error: any) {
              flash('error', error?.message || 'Failed');
            }
          }}>{t('save')}</Button>
        </Stack>
        {message && <Alert severity={message.type} sx={{ mt: 2 }}>{message.text}</Alert>}
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('shiftName')}</TableCell>
              <TableCell>{t('status')}</TableCell>
              <TableCell>{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell>{shift.name}</TableCell>
                <TableCell>{shift.active ? t('approved') : t('blocked')}</TableCell>
                <TableCell><Button color="error" onClick={async () => { await removeShiftName(shift.id); flash('success', 'تم الحذف'); }}>حذف</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
