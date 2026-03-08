import { useMemo, useState } from 'react';
import { Alert, Button, Grid2 as Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { paymentMethods, saleTypes } from '../lib/catalog';
import type { InvoiceLine, StockSource } from '../types';
import { useAppStore } from '../store/AppContext';

function emptyLine(): InvoiceLine {
  return {
    id: uuid(),
    category: 'service',
    saleType: 'service',
    brand: '',
    name: '',
    quantity: 1,
    price: 0,
    total: 0
  };
}

function buildInvoiceNumber(createdAtMs: number) {
  return dayjs(createdAtMs).format('DDMMYYYYHHmmss');
}

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const { shifts, currentShiftId, setCurrentShift, currentShiftName, inventory, saveMainInvoice } = useAppStore();
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const brandsByType = useMemo(() => {
    const map = new Map<string, string[]>();
    inventory.forEach((item) => {
      const key = `${item.category}-${item.saleType}-${item.sourceLocation || 'service'}`;
      map.set(key, Array.from(new Set([...(map.get(key) || []), item.brand])));
    });
    return map;
  }, [inventory]);

  const flash = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 10000);
  };

  const updateLine = (id: string, patch: Partial<InvoiceLine>) => {
    setLines((prev) => prev.map((line) => {
      if (line.id !== id) return line;
      const next = { ...line, ...patch };
      const matches = inventory.filter((item) =>
        item.category === next.category &&
        item.saleType === next.saleType &&
        (next.category === 'service' ? true : item.brand === next.brand) &&
        item.active &&
        (next.category === 'service' || item.sourceLocation === next.sourceLocation)
      );
      const selected = matches.find((item) => item.id === patch.inventoryItemId);
      if (selected) {
        next.inventoryItemId = selected.id;
        next.name = selected.name;
        next.price = selected.price;
        next.total = selected.price * next.quantity;
        next.model = selected.model;
        next.flavor = selected.flavor;
        next.nicotine = selected.nicotine;
        next.brand = next.category === 'service' ? '' : selected.brand;
        next.sourceLocation = selected.sourceLocation;
      } else {
        next.total = next.price * next.quantity;
      }
      if (next.category === 'service') {
        next.sourceLocation = undefined;
        next.brand = '';
        next.model = undefined;
        next.flavor = undefined;
        next.nicotine = undefined;
      }
      return next;
    }));
  };

  const total = useMemo(() => lines.reduce((sum, line) => sum + line.total, 0), [lines]);

  const filteredItems = (line: InvoiceLine) => inventory.filter((item) =>
    item.category === line.category &&
    item.saleType === line.saleType &&
    (line.category === 'service' ? true : item.brand === line.brand) &&
    item.active &&
    (line.category === 'service' || item.sourceLocation === line.sourceLocation)
  );

  const locationOptions: { value: StockSource; label: string }[] = [
    { value: 'shop', label: t('shop') },
    { value: 'warehouse', label: t('warehouse') }
  ];

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label={t('employee')} value={currentShiftId} onChange={(e) => setCurrentShift(e.target.value)}>
              {shifts.map((shift) => <MenuItem key={shift.id} value={shift.id}>{shift.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label={t('paymentMethod')} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {paymentMethods.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {lines.map((line, index) => {
        const brands = brandsByType.get(`${line.category}-${line.saleType}-${line.sourceLocation || 'service'}`) || [];
        const items = filteredItems(line);
        return (
          <Paper key={line.id} sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField select fullWidth label={t('categoryType')} value={line.category} onChange={(e) => updateLine(line.id, { category: e.target.value as any, saleType: e.target.value === 'service' ? 'service' : 'vape', sourceLocation: undefined, brand: '', name: '', inventoryItemId: undefined, price: 0 })}>
                  <MenuItem value="service">{t('service')}</MenuItem>
                  <MenuItem value="sale">{t('sale')}</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField select fullWidth label={t('saleType')} value={line.saleType} onChange={(e) => updateLine(line.id, { saleType: e.target.value as any, brand: '', name: '', inventoryItemId: undefined, price: 0 })} disabled={line.category === 'service'}>
                  {line.category === 'service'
                    ? <MenuItem value="service">{t('services')}</MenuItem>
                    : saleTypes.map((item) => <MenuItem key={item.value} value={item.value}>{i18n.language === 'ar' ? item.labelAr : item.labelEn}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField select fullWidth label={t('stockSource')} value={line.sourceLocation || ''} onChange={(e) => updateLine(line.id, { sourceLocation: e.target.value as StockSource, brand: '', name: '', inventoryItemId: undefined, price: 0 })} disabled={line.category === 'service'}>
                  {locationOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField select fullWidth label={t('brand')} value={line.brand} onChange={(e) => updateLine(line.id, { brand: e.target.value, inventoryItemId: undefined, name: '', price: 0 })} disabled={line.category === 'service'}>
                  {brands.map((brandOption) => <MenuItem key={brandOption} value={brandOption}>{brandOption}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField select fullWidth label={line.category === 'service' ? t('services') : (line.saleType === 'liquid' ? t('flavor') : t('model'))} value={line.inventoryItemId || ''} onChange={(e) => updateLine(line.id, { inventoryItemId: e.target.value })} disabled={line.category === 'service' ? false : !line.brand}>
                  {items.map((item) => <MenuItem key={item.id} value={item.id}>{line.category === 'service' ? (item.serviceName || item.name) : (item.saleType === 'liquid' ? (item.flavor || item.name) : (item.model || item.name))}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <TextField fullWidth type="number" label={t('qty')} value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value || 1) })} />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <TextField fullWidth label={t('price')} value={line.price} InputProps={{ readOnly: true }} />
              </Grid>
            </Grid>
            <Stack direction="row" justifyContent="space-between" mt={2}>
              <Typography variant="body2">{line.name || '...'}</Typography>
              <Typography variant="body2" fontWeight={700}>{t('total')}: {line.total.toFixed(2)}</Typography>
            </Stack>
            {index > 0 && <Button color="error" size="small" sx={{ mt: 1 }} onClick={() => setLines((prev) => prev.filter((item) => item.id !== line.id))}>Remove</Button>}
          </Paper>
        );
      })}

      <Button variant="outlined" onClick={() => setLines((prev) => [...prev, emptyLine()])}>{t('addRow')}</Button>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField fullWidth label={t('notes')} value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />
          <Typography variant="h6">{t('total')}: {total.toFixed(2)}</Typography>
          <Button variant="contained" size="large" disabled={!currentShiftId || lines.some((line) => !line.inventoryItemId)} onClick={async () => {
            try {
              if (!currentShiftId || !currentShiftName) return flash('error', t('shiftRequired'));
              const createdAtMs = Date.now();
              const invoiceNumber = buildInvoiceNumber(createdAtMs);
              await saveMainInvoice({
                id: uuid(),
                invoiceNumber,
                employeeId: currentShiftId,
                employeeName: currentShiftName,
                lines,
                paymentMethod,
                notes,
                subtotal: total,
                total,
                createdAtMs
              });
              setSavedInvoiceNumber(invoiceNumber);
              flash('success', t('invoiceSaved'));
              window.setTimeout(() => setSavedInvoiceNumber(''), 30000);
              setLines([emptyLine()]);
              setNotes('');
            } catch (error: any) {
              flash('error', error?.message || 'Failed to save invoice');
            }
          }}>{t('saveInvoice')}</Button>
          {savedInvoiceNumber && <Alert severity="success">{t('invoiceNumber')}: {savedInvoiceNumber}</Alert>}
          {message && <Alert severity={message.type}>{message.text}</Alert>}
        </Stack>
      </Paper>
    </Stack>
  );
}
