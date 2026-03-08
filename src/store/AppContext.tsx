import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { DeviceRecord, InventoryItem, Invoice, ShiftUser, SystemSettings } from '../types';
import { ThemeMode } from '../theme';
import {
  addInventoryItem,
  addShift,
  changeAdminPassword,
  createAdminUser,
  deleteInventoryItem,
  deleteShift,
  editInvoice,
  ensureBootstrap,
  getMonthlyInvoices,
  getTodayInvoices,
  listenDevice,
  listenInventory,
  listenInvoicesToday,
  listenSettings,
  listenShifts,
  logoutAdmin,
  requestReset,
  saveInvoice,
  saveAdminEmail,
  signInAdmin,
  updateAdminCredentials,
  updateInventoryItem,
  watchAuth
} from '../lib/firebase';
import { buildDailyWorkbook, buildMonthlyWorkbook, workbookToArrayBuffer } from '../lib/exporters';

interface AppState {
  themeMode: ThemeMode;
  language: 'ar' | 'en';
  settings?: SystemSettings;
  inventory: InventoryItem[];
  shifts: ShiftUser[];
  invoicesToday: Invoice[];
  currentShiftId: string;
  currentShiftName: string;
  setCurrentShift: (id: string) => void;
  themeToggle: () => void;
  setThemeModeValue: (mode: ThemeMode) => void;
  setLanguage: (lang: 'ar' | 'en') => void;
  device?: DeviceRecord;
  version: string;
  deviceInfo?: { deviceId: string; deviceName: string; platform: string; appVersion: string };
  adminUserEmail?: string;
  authReady: boolean;
  adminDialogOpen: boolean;
  setAdminDialogOpen: (open: boolean) => void;
  updateState?: { type: string; progress?: any; message?: string; info?: any };
  saveMainInvoice: (payload: Omit<Invoice, 'appVersion' | 'deviceId' | 'deviceName'>) => Promise<void>;
  saveInvoiceEdit: (original: Invoice, updated: Invoice) => Promise<void>;
  addShiftName: (name: string) => Promise<void>;
  removeShiftName: (id: string) => Promise<void>;
  createInventoryEntry: (item: Omit<InventoryItem, 'id' | 'active'>) => Promise<void>;
  patchInventoryEntry: (id: string, patch: Partial<InventoryItem>) => Promise<void>;
  removeInventoryEntry: (id: string) => Promise<void>;
  signInOwner: (email: string, password: string) => Promise<void>;
  createOwner: (email: string, password: string) => Promise<void>;
  changeOwnerPassword: (password: string) => Promise<void>;
  saveOwnerEmail: (email: string) => Promise<void>;
  saveOwnerCredentials: (email: string, password?: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  runDailyExport: () => Promise<void>;
  runMonthlyExport: () => Promise<void>;
  openExportsFolder: () => Promise<void>;
  checkUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [themeMode, setThemeMode] = useState<ThemeMode>((localStorage.getItem('mv-theme') as ThemeMode) || 'dark');
  const [language, setLanguageState] = useState<'ar' | 'en'>((localStorage.getItem('mv-language') as 'ar' | 'en') || 'ar');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shifts, setShifts] = useState<ShiftUser[]>([]);
  const [invoicesToday, setInvoicesToday] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<SystemSettings>();
  const [device, setDevice] = useState<DeviceRecord>();
  const [deviceInfo, setDeviceInfo] = useState<any>();
  const [version, setVersion] = useState('1.0.0');
  const [currentShiftId, setCurrentShiftId] = useState(localStorage.getItem('mv-current-shift') || '');
  const [adminUserEmail, setAdminUserEmail] = useState<string>();
  const [authReady, setAuthReady] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [updateState, setUpdateState] = useState<any>();

  useEffect(() => {
    window.desktopAPI.getVersion().then((data) => setVersion(data.version));
    window.desktopAPI.getDeviceInfo().then(async (info) => {
      setDeviceInfo(info);
      await ensureBootstrap({ ...info, status: 'pending' });
    });
  }, []);

  useEffect(() => {
    const off = watchAuth((user) => {
      setAdminUserEmail(user?.email || undefined);
      setAuthReady(true);
    });
    return off;
  }, []);

  useEffect(() => {
    const unsub = listenSettings((data) => {
      setSettings(data);
      if (!data.adminEmailSet) setAdminDialogOpen(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!deviceInfo) return;
    const unsub = listenDevice(deviceInfo.deviceId, setDevice);
    return unsub;
  }, [deviceInfo]);

  useEffect(() => listenInventory(setInventory), []);
  useEffect(() => listenShifts(setShifts), []);
  useEffect(() => listenInvoicesToday(setInvoicesToday), []);

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('mv-language', language);
  }, [language, i18n]);

  useEffect(() => {
    localStorage.setItem('mv-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const unsub = window.desktopAPI.onUpdateStatus((payload) => setUpdateState(payload));
    return unsub;
  }, []);

  useEffect(() => {
    if (!deviceInfo) return;
    const timer = setInterval(() => ensureBootstrap({ ...deviceInfo, status: 'pending' }).catch(() => undefined), 10000);
    const updates = setInterval(() => {
      window.desktopAPI.checkForUpdates().catch(() => undefined);
    }, 10 * 60 * 1000);
    return () => {
      clearInterval(timer);
      clearInterval(updates);
    };
  }, [deviceInfo]);

  useEffect(() => {
    runScheduledExports().catch(() => undefined);
  }, [invoicesToday]);

  const currentShiftName = useMemo(
    () => shifts.find((item) => item.id === currentShiftId)?.name || '',
    [shifts, currentShiftId]
  );

  function setLanguage(lang: 'ar' | 'en') {
    setLanguageState(lang);
  }

  function themeToggle() {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function setThemeModeValue(mode: ThemeMode) {
    setThemeMode(mode);
  }

  function setCurrentShift(id: string) {
    setCurrentShiftId(id);
    localStorage.setItem('mv-current-shift', id);
  }

  async function saveMainInvoice(payload: Omit<Invoice, 'appVersion' | 'deviceId' | 'deviceName'>) {
    if (!deviceInfo) throw new Error('Device info unavailable');
    const invoice: Invoice = {
      ...payload,
      appVersion: version,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      createdAt: new Date(),
      createdAtMs: payload.createdAtMs || Date.now()
    };
    await saveInvoice(invoice);
  }

  async function saveInvoiceEdit(original: Invoice, updated: Invoice) {
    await editInvoice(original, updated, currentShiftName || adminUserEmail || 'Unknown');
  }

  async function createInventoryEntry(item: Omit<InventoryItem, 'id' | 'active'>) {
    await addInventoryItem(item, currentShiftName || adminUserEmail || 'owner');
  }

  async function patchInventoryEntry(id: string, patch: Partial<InventoryItem>) {
    const original = inventory.find((item) => item.id === id);
    if (!original) return;
    const merged = { ...original, ...patch };
    const nextPatch: Partial<InventoryItem> = { ...patch };
    if (merged.category === 'service') {
      const serviceLabel = (patch.serviceName ?? patch.model ?? merged.serviceName ?? merged.model ?? merged.name ?? original.serviceName ?? '').toString().trim();
      nextPatch.saleType = 'service';
      nextPatch.serviceName = serviceLabel;
      nextPatch.name = serviceLabel;
      nextPatch.model = serviceLabel;
      nextPatch.brand = (patch.brand ?? merged.brand ?? original.brand ?? 'Service').toString();
      nextPatch.flavor = '';
      nextPatch.nicotine = '';
      nextPatch.sourceLocation = undefined;
    } else {
      nextPatch.name = [
        (merged.brand || '').toString().trim(),
        ((merged.saleType === 'liquid' ? merged.flavor : merged.model) || '').toString().trim(),
        (merged.nicotine || '').toString().trim(),
        merged.sourceLocation === 'shop' ? 'محل' : merged.sourceLocation === 'warehouse' ? 'مخزن' : ''
      ].filter(Boolean).join(' - ');
      nextPatch.serviceName = '';
    }
    await updateInventoryItem(id, nextPatch);
  }

  async function removeInventoryEntry(id: string) {
    await deleteInventoryItem(id);
  }

  async function createOwner(email: string, password: string) {
    await createAdminUser(email, password);
    setAdminDialogOpen(false);
  }

  async function signInOwner(email: string, password: string) {
    await signInAdmin(email, password);
  }

  async function changeOwnerPassword(password: string) {
    await changeAdminPassword(password);
  }

  async function saveOwnerEmail(email: string) {
    await saveAdminEmail(email);
  }

  async function saveOwnerCredentials(email: string, password?: string) {
    await updateAdminCredentials(email, password);
  }

  async function sendResetEmail(email: string) {
    await requestReset(email);
  }

  async function logout() {
    await logoutAdmin();
  }

  async function addShiftName(name: string) {
    await addShift(name, adminUserEmail || 'owner');
  }

  async function removeShiftName(id: string) {
    await deleteShift(id);
  }

  async function runDailyExport() {
    const dateKey = dayjs().format('YYYY-MM-DD');
    const rows = await getTodayInvoices();
    const wb = buildDailyWorkbook(dateKey, rows);
    const data = workbookToArrayBuffer(wb);
    await window.desktopAPI.writeExport({
      relativePath: `daily/${dateKey}/transactions-${dateKey}.xlsx`,
      buffer: data
    });
  }

  async function runMonthlyExport() {
    const year = dayjs().year();
    const month = dayjs().month();
    const key = dayjs().format('YYYY-MM');
    const rows = await getMonthlyInvoices(year, month);
    const wb = buildMonthlyWorkbook(key, rows);
    const data = workbookToArrayBuffer(wb);
    await window.desktopAPI.writeExport({
      relativePath: `monthly/${key}/transactions-${key}.xlsx`,
      buffer: data
    });
  }

  async function runScheduledExports() {
    const now = dayjs();
    const dateKey = now.format('YYYY-MM-DD');
    const todayExportKey = `daily-${dateKey}`;
    const lastDaily = localStorage.getItem('mv-last-daily-export');
    if (lastDaily !== todayExportKey && now.hour() === 23 && now.minute() >= 59) {
      await runDailyExport();
      localStorage.setItem('mv-last-daily-export', todayExportKey);
    }
    const monthKey = now.format('YYYY-MM');
    const monthExportKey = `monthly-${monthKey}`;
    const lastMonthly = localStorage.getItem('mv-last-monthly-export');
    if (lastMonthly !== monthExportKey && now.date() === now.daysInMonth() && now.hour() === 23 && now.minute() >= 59) {
      await runMonthlyExport();
      localStorage.setItem('mv-last-monthly-export', monthExportKey);
    }
  }

  async function openExportsFolder() {
    await window.desktopAPI.openExportsFolder();
  }

  async function checkUpdates() {
    await window.desktopAPI.checkForUpdates();
  }

  async function installUpdate() {
    await window.desktopAPI.installUpdate();
  }

  const value: AppState = {
    themeMode,
    language,
    settings,
    inventory,
    shifts,
    invoicesToday,
    currentShiftId,
    currentShiftName,
    setCurrentShift,
    themeToggle,
    setThemeModeValue,
    setLanguage,
    device,
    version,
    deviceInfo,
    adminUserEmail,
    authReady,
    adminDialogOpen,
    setAdminDialogOpen,
    updateState,
    saveMainInvoice,
    saveInvoiceEdit,
    addShiftName,
    removeShiftName,
    createInventoryEntry,
    patchInventoryEntry,
    removeInventoryEntry,
    signInOwner,
    createOwner,
    changeOwnerPassword,
    saveOwnerEmail,
    saveOwnerCredentials,
    sendResetEmail,
    logout,
    runDailyExport,
    runMonthlyExport,
    openExportsFolder,
    checkUpdates,
    installUpdate
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider');
  return ctx;
}
