import { initializeApp } from 'firebase/app';
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updatePassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
  updateEmail
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  addDoc,
  where,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { v4 as uuid } from 'uuid';
import type { DeviceRecord, InventoryItem, Invoice, InvoiceEdit, ShiftUser, SystemSettings } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


function sanitizeFirestoreData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeFirestoreData(item))
      .filter((item) => item !== undefined) as T;
  }
  if (value && typeof value === 'object') {
    const output: Record<string, any> = {};
    for (const [key, entry] of Object.entries(value as Record<string, any>)) {
      if (entry === undefined) continue;
      output[key] = sanitizeFirestoreData(entry);
    }
    return output as T;
  }
  return value;
}


export const refs = {
  settings: doc(db, 'settings', 'main'),
  devices: collection(db, 'devices'),
  inventory: collection(db, 'inventory_items'),
  shifts: collection(db, 'shift_users'),
  invoices: collection(db, 'transactions'),
  invoiceEdits: collection(db, 'transaction_edits'),
  auditLogs: collection(db, 'audit_logs'),
  exports: collection(db, 'exports')
};

export async function ensureBootstrap(deviceInfo: DeviceRecord) {
  const settingsSnap = await getDoc(refs.settings);
  if (!settingsSnap.exists()) {
    await setDoc(refs.settings, {
      adminEmail: '',
      adminEmailSet: false,
      passwordConfiguredAt: null,
      defaultLanguage: 'ar',
      defaultTheme: 'dark',
      company: 'FRTS',
      exportMeta: {
        lastDailyKey: '',
        lastMonthlyKey: ''
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  const deviceRef = doc(db, 'devices', deviceInfo.deviceId);
  const deviceSnap = await getDoc(deviceRef);
  if (!deviceSnap.exists()) {
    await setDoc(deviceRef, {
      ...deviceInfo,
      status: 'pending',
      blockedReason: '',
      graceUntil: Date.now() + 24 * 60 * 60 * 1000,
      lastSeenAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    await updateDoc(deviceRef, {
      deviceName: deviceInfo.deviceName,
      appVersion: deviceInfo.appVersion,
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

export function listenSettings(callback: (data: SystemSettings) => void) {
  return onSnapshot(refs.settings, (snap) => {
    const data = snap.data() as SystemSettings | undefined;
    if (data) callback({ id: snap.id, ...data });
  });
}

export function listenDevice(deviceId: string, callback: (data: DeviceRecord) => void) {
  return onSnapshot(doc(db, 'devices', deviceId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...(snap.data() as DeviceRecord) });
  });
}

export function listenInventory(callback: (items: InventoryItem[]) => void) {
  const q = query(refs.inventory, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as InventoryItem) }))));
}

export function listenShifts(callback: (items: ShiftUser[]) => void) {
  const q = query(refs.shifts, orderBy('name', 'asc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ShiftUser) }))));
}

export function listenInvoicesToday(callback: (items: Invoice[]) => void) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const q = query(refs.invoices, where('createdAtMs', '>=', start.getTime()), orderBy('createdAtMs', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Invoice) }))));
}

export async function createAdminUser(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateDoc(refs.settings, {
    adminEmail: email,
    adminEmailSet: true,
    passwordConfiguredAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return result.user;
}

export async function signInAdmin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function saveAdminEmail(email: string) {
  await updateDoc(refs.settings, {
    adminEmail: email,
    adminEmailSet: !!email,
    updatedAt: serverTimestamp()
  });
}

export async function ensureAdminAccess(email: string, password: string) {
  if (auth.currentUser?.email === email) return auth.currentUser;
  try {
    const signIn = await signInWithEmailAndPassword(auth, email, password);
    return signIn.user;
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      const created = await createUserWithEmailAndPassword(auth, email, password);
      return created.user;
    }
    throw error;
  }
}

export async function updateAdminCredentials(email: string, password?: string) {
  await saveAdminEmail(email);
  if (!password) return;
  const user = await ensureAdminAccess(email, password);
  if (user.email !== email) {
    await updateEmail(user, email);
  }
  await updatePassword(user, password);
  await updateDoc(refs.settings, {
    adminEmail: email,
    adminEmailSet: true,
    passwordConfiguredAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function changeAdminPassword(newPassword: string) {
  if (!auth.currentUser) throw new Error('No active user');
  await updatePassword(auth.currentUser, newPassword);
  await updateDoc(refs.settings, { updatedAt: serverTimestamp() });
}

export async function requestReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function logoutAdmin() {
  return signOut(auth);
}

export async function addShift(name: string, actor: string) {
  await addDoc(refs.shifts, sanitizeFirestoreData({
    name,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actor
  }));
}

export async function addInventoryItem(item: Omit<InventoryItem, 'createdAt' | 'updatedAt' | 'active'>, actor: string) {
  await addDoc(refs.inventory, sanitizeFirestoreData({
    ...item,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actor
  }));
}

export async function updateInventoryItem(id: string, patch: Partial<InventoryItem>) {
  await updateDoc(doc(db, 'inventory_items', id), sanitizeFirestoreData({
    ...patch,
    updatedAt: serverTimestamp()
  }));
}

export async function saveInvoice(invoice: Invoice) {
  const invoiceRef = doc(db, 'transactions', invoice.id);
  await runTransaction(db, async (transaction) => {
    for (const line of invoice.lines) {
      if (!line.inventoryItemId) continue;
      const invRef = doc(db, 'inventory_items', line.inventoryItemId);
      const invSnap = await transaction.get(invRef);
      if (!invSnap.exists()) throw new Error('Inventory item not found');
      const current = invSnap.data().stock ?? 0;
      if (line.category === 'sale' && current < line.quantity) throw new Error(`Not enough stock for ${line.name}`);
      const nextStock = line.category === 'sale' ? current - line.quantity : current;
      transaction.update(invRef, { stock: nextStock, updatedAt: serverTimestamp() });
    }
    transaction.set(invoiceRef, sanitizeFirestoreData(invoice));
  });
  await addDoc(refs.auditLogs, sanitizeFirestoreData({
    type: 'invoice_created',
    invoiceId: invoice.id,
    actor: invoice.employeeName,
    createdAt: serverTimestamp(),
    payload: invoice
  }));
}

export async function editInvoice(original: Invoice, updated: Invoice, actor: string) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'transactions', original.id), sanitizeFirestoreData({
    ...updated,
    edited: true,
    lastEditedAt: serverTimestamp(),
    lastEditedBy: actor
  }));
  batch.set(doc(db, 'transaction_edits', uuid()), sanitizeFirestoreData({
    invoiceId: original.id,
    original,
    updated,
    editedBy: actor,
    createdAt: serverTimestamp()
  } as InvoiceEdit));
  batch.set(doc(db, 'audit_logs', uuid()), sanitizeFirestoreData({
    type: 'invoice_edited',
    invoiceId: original.id,
    actor,
    createdAt: serverTimestamp(),
    payload: { original, updated }
  }));
  await batch.commit();
}

export async function getTodayInvoices() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const q = query(refs.invoices, where('createdAtMs', '>=', start.getTime()), orderBy('createdAtMs', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Invoice) }));
}

export async function getMonthlyInvoices(year: number, month: number) {
  const start = new Date(year, month, 1).getTime();
  const end = new Date(year, month + 1, 1).getTime();
  const q = query(refs.invoices, where('createdAtMs', '>=', start), where('createdAtMs', '<', end), orderBy('createdAtMs', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Invoice) }));
}

export async function updateExportMeta(meta: Partial<SystemSettings['exportMeta']>) {
  await updateDoc(refs.settings, {
    exportMeta: meta,
    updatedAt: serverTimestamp()
  });
}
export async function deleteShift(id: string) {
  await deleteDoc(doc(db, 'shift_users', id));
}

export async function deleteInventoryItem(id: string) {
  await deleteDoc(doc(db, 'inventory_items', id));
}
