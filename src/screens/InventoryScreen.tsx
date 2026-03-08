import { useMemo, useState } from 'react';
import { Alert, Button, Grid2 as Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { InventoryItem, SaleType, StockSource } from '../types';
import { defaultServices, saleTypes } from '../lib/catalog';
import { useAppStore } from '../store/AppContext';

export default function InventoryScreen() {
  const { t, i18n } = useTranslation();
  const { inventory, createInventoryEntry, patchInventoryEntry, removeInventoryEntry, openExportsFolder, runDailyExport, runMonthlyExport } = useAppStore();
  const [category, setCategory] = useState<'service' | 'sale'>('sale');
  const [saleType, setSaleType] = useState<SaleType>('vape');
  const [serviceName, setServiceName] = useState(defaultServices[0] || '');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [flavor, setFlavor] = useState('');
  const [nicotine, setNicotine] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [sourceLocation, setSourceLocation] = useState<StockSource>('shop');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<InventoryItem>>>({});

  const totalItems = useMemo(() => inventory.reduce((sum, item) => sum + (Number(item.stock) || 0), 0), [inventory]);

  const flash = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 10000);
  };

  const patchDraft = (id: string, patch: Partial<InventoryItem>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        ...patch
      }
    }));
  };

  const buildNewItem = (): Omit<InventoryItem, 'id' | 'active'> => {
    if (category === 'service') {
      const label = (serviceName || '').trim();
      return {
        category: 'service',
        saleType: 'service',
        serviceName: label,
        brand: 'Service',
        model: label,
        flavor: '',
        nicotine: '',
        name: label,
        price: Number(price || 0),
        stock: Number(stock || 0)
      };
    }

    const normalizedBrand = (brand || 'General').trim();
    const normalizedModel = (model || '').trim();
    const normalizedFlavor = (flavor || '').trim();
    const normalizedNicotine = (nicotine || '').trim();
    const generatedName = [
      normalizedBrand,
      saleType === 'liquid' ? normalizedFlavor : normalizedModel,
      normalizedNicotine,
      sourceLocation === 'shop' ? t('shop') : t('warehouse')
    ].filter(Boolean).join(' - ');

    return {
      category: 'sale',
      saleType,
      brand: normalizedBrand,
      model: normalizedModel,
      flavor: normalizedFlavor,
      nicotine: normalizedNicotine,
      sourceLocation,
      name: generatedName,
      price: Number(price || 0),
      stock: Number(stock || 0)
    };
  };

  return (
    <Stack spacing={2} sx={{ pb: 6 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>{t('addInventoryItem')}</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField select fullWidth value={category} label={t('categoryType')} onChange={(e) => setCategory(e.target.value as 'service' | 'sale')}>
              <MenuItem value="sale">{t('sale')}</MenuItem>
              <MenuItem value="service">{t('service')}</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField select fullWidth value={category === 'service' ? 'service' : saleType} label={t('saleType')} onChange={(e) => setSaleType(e.target.value as SaleType)} disabled={category === 'service'}>
              {category === 'service'
                ? <MenuItem value="service">{t('services')}</MenuItem>
                : saleTypes.map((item) => <MenuItem key={item.value} value={item.value}>{i18n.language === 'ar' ? item.labelAr : item.labelEn}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            {category === 'service' ? (
              <TextField fullWidth value={serviceName} label={t('services')} onChange={(e) => setServiceName(e.target.value)} />
            ) : (
              <TextField fullWidth value={brand} label={t('brand')} onChange={(e) => setBrand(e.target.value)} />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField fullWidth value={model} label={t('model')} disabled={category === 'service'} onChange={(e) => setModel(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField fullWidth value={flavor} label={t('flavor')} disabled={category === 'service'} onChange={(e) => setFlavor(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField fullWidth value={nicotine} label={t('nicotine')} disabled={category === 'service'} onChange={(e) => setNicotine(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField fullWidth type="number" value={price} label={t('price')} onChange={(e) => setPrice(Number(e.target.value || 0))} />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField fullWidth type="number" value={stock} label={t('stock')} onChange={(e) => setStock(Number(e.target.value || 0))} />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField select fullWidth value={sourceLocation} label={t('stockSource')} onChange={(e) => setSourceLocation(e.target.value as StockSource)} disabled={category === 'service'}>
              <MenuItem value="shop">{t('shop')}</MenuItem>
              <MenuItem value="warehouse">{t('warehouse')}</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              sx={{ height: '100%' }}
              onClick={async () => {
                try {
                  await createInventoryEntry(buildNewItem());
                  setBrand('');
                  setModel('');
                  setFlavor('');
                  setNicotine('');
                  setPrice(0);
                  setStock(0);
                  if (category === 'service') setServiceName('');
                  flash('success', 'تم الحفظ');
                } catch (error: any) {
                  flash('error', error?.message || 'Failed');
                }
              }}
            >
              {t('save')}
            </Button>
          </Grid>
        </Grid>
        {message && <Alert severity={message.type} sx={{ mt: 2 }}>{message.text}</Alert>}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h6">{t('stockOverview')} · {totalItems}</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={async () => {
                try {
                  await runDailyExport();
                  flash('success', 'تم التصدير');
                } catch (e: any) {
                  flash('error', e?.message || 'Failed');
                }
              }}
            >
              {t('exportDaily')}
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                try {
                  await runMonthlyExport();
                  flash('success', 'تم التصدير');
                } catch (e: any) {
                  flash('error', e?.message || 'Failed');
                }
              }}
            >
              {t('exportMonthly')}
            </Button>
            <Button variant="contained" onClick={openExportsFolder}>{t('exportFolder')}</Button>
          </Stack>
        </Stack>
        <Stack sx={{ maxHeight: '55vh', overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t('categoryType')}</TableCell>
                <TableCell>{t('saleType')}</TableCell>
                <TableCell>{t('brand')}</TableCell>
                <TableCell>{t('model')}</TableCell>
                <TableCell>{t('flavor')}</TableCell>
                <TableCell>{t('nicotine')}</TableCell>
                <TableCell>{t('stockSource')}</TableCell>
                <TableCell>{t('price')}</TableCell>
                <TableCell>{t('stock')}</TableCell>
                <TableCell>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((item) => {
                const draft = drafts[item.id] || {};
                const draftCategory = (draft.category ?? item.category) as 'service' | 'sale';
                const draftSaleType = (draft.saleType ?? item.saleType) as InventoryItem['saleType'];
                const serviceLabel = (draft.serviceName ?? draft.model ?? item.serviceName ?? item.model ?? item.name ?? '').toString();
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={draftCategory}
                        onChange={(e) => patchDraft(item.id, {
                          category: e.target.value as any,
                          saleType: e.target.value === 'service' ? 'service' : (draftSaleType === 'service' ? 'vape' : draftSaleType)
                        })}
                      >
                        <MenuItem value="sale">{t('sale')}</MenuItem>
                        <MenuItem value="service">{t('service')}</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField select size="small" value={draftCategory === 'service' ? 'service' : draftSaleType} onChange={(e) => patchDraft(item.id, { saleType: e.target.value as any })} disabled={draftCategory === 'service'}>
                        {draftCategory === 'service'
                          ? <MenuItem value="service">{t('services')}</MenuItem>
                          : saleTypes.map((option) => <MenuItem key={option.value} value={option.value}>{i18n.language === 'ar' ? option.labelAr : option.labelEn}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={draft.brand ?? item.brand ?? ''} onChange={(e) => patchDraft(item.id, { brand: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={draftCategory === 'service' ? serviceLabel : (draft.model ?? item.model ?? '')}
                        onChange={(e) => patchDraft(item.id, draftCategory === 'service' ? { serviceName: e.target.value, model: e.target.value, name: e.target.value } : { model: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={draft.flavor ?? item.flavor ?? ''} onChange={(e) => patchDraft(item.id, { flavor: e.target.value })} disabled={draftCategory === 'service'} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={draft.nicotine ?? item.nicotine ?? ''} onChange={(e) => patchDraft(item.id, { nicotine: e.target.value })} disabled={draftCategory === 'service'} />
                    </TableCell>
                    <TableCell>
                      {draftCategory === 'service' ? '-' : (
                        <TextField select size="small" value={(draft.sourceLocation ?? item.sourceLocation ?? 'shop') as string} onChange={(e) => patchDraft(item.id, { sourceLocation: e.target.value as StockSource })}>
                          <MenuItem value="shop">{t('shop')}</MenuItem>
                          <MenuItem value="warehouse">{t('warehouse')}</MenuItem>
                        </TextField>
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={draft.price ?? item.price ?? 0} onChange={(e) => patchDraft(item.id, { price: Number(e.target.value || 0) })} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={draft.stock ?? item.stock ?? 0} onChange={(e) => patchDraft(item.id, { stock: Number(e.target.value || 0) })} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={async () => {
                            try {
                              const patch = drafts[item.id] || {};
                              await patchInventoryEntry(item.id, patch);
                              setDrafts((prev) => {
                                const next = { ...prev };
                                delete next[item.id];
                                return next;
                              });
                              flash('success', 'تم التحديث');
                            } catch (error: any) {
                              flash('error', error?.message || 'Failed');
                            }
                          }}
                        >
                          {t('saveChanges')}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={async () => {
                            try {
                              await removeInventoryEntry(item.id);
                              flash('success', 'تم الحذف');
                            } catch (e: any) {
                              flash('error', e?.message || 'Failed');
                            }
                          }}
                        >
                          حذف
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Stack>
      </Paper>
    </Stack>
  );
}
