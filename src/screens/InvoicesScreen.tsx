import { useMemo, useState } from 'react';
import { Button, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/AppContext';
import type { Invoice } from '../types';

export default function InvoicesScreen() {
  const { t } = useTranslation();
  const { invoicesToday, saveInvoiceEdit, shifts, currentShiftId } = useAppStore();
  const [selectedId, setSelectedId] = useState('');
  const selectedInvoice = useMemo(() => invoicesToday.find((item) => item.id === selectedId), [invoicesToday, selectedId]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const loadInvoice = (invoice?: Invoice) => {
    if (!invoice) return;
    setNotes(invoice.notes);
    setPaymentMethod(invoice.paymentMethod);
  };

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">{t('invoices')}</Typography>
        <Stack direction="row" spacing={2} mt={2}>
          <TextField select fullWidth value={selectedId} label={t('invoiceNumber')} onChange={(e) => { setSelectedId(e.target.value); loadInvoice(invoicesToday.find((item) => item.id === e.target.value)); }}>
            {invoicesToday.map((invoice) => <MenuItem key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} - {invoice.employeeName}</MenuItem>)}
          </TextField>
          <TextField fullWidth value={paymentMethod} label={t('paymentMethod')} onChange={(e) => setPaymentMethod(e.target.value)} />
          <TextField fullWidth value={notes} label={t('notes')} onChange={(e) => setNotes(e.target.value)} />
          <Button
            variant="contained"
            disabled={!selectedInvoice || !currentShiftId}
            onClick={async () => {
              if (!selectedInvoice) return;
              await saveInvoiceEdit(selectedInvoice, { ...selectedInvoice, notes, paymentMethod });
            }}
          >
            {t('saveChanges')}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('invoiceNumber')}</TableCell>
              <TableCell>{t('employee')}</TableCell>
              <TableCell>{t('paymentMethod')}</TableCell>
              <TableCell>{t('total')}</TableCell>
              <TableCell>{t('notes')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoicesToday.map((invoice) => (
              <TableRow key={invoice.id} selected={selectedId === invoice.id}>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.employeeName}</TableCell>
                <TableCell>{invoice.paymentMethod}</TableCell>
                <TableCell>{invoice.total}</TableCell>
                <TableCell>{invoice.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}