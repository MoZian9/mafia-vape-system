export type CategoryType = 'service' | 'sale';
export type SaleType = 'vape' | 'pod' | 'liquid' | 'coil' | 'cartridge' | 'cotton' | 'battery' | 'charger' | 'accessory' | 'tank' | 'glass';
export type DeviceStatus = 'approved' | 'pending' | 'blocked';
export type StockSource = 'shop' | 'warehouse';

export interface InventoryItem {
  id: string;
  category: CategoryType;
  saleType: SaleType | 'service';
  serviceName?: string;
  brand: string;
  model?: string;
  flavor?: string;
  nicotine?: string;
  name: string;
  price: number;
  stock: number;
  sourceLocation?: StockSource;
  active: boolean;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface InvoiceLine {
  id: string;
  category: CategoryType;
  saleType: SaleType | 'service';
  brand: string;
  model?: string;
  flavor?: string;
  nicotine?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  sourceLocation?: StockSource;
  inventoryItemId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  employeeId: string;
  employeeName: string;
  lines: InvoiceLine[];
  paymentMethod: string;
  notes: string;
  subtotal: number;
  total: number;
  createdAtMs: number;
  createdAt?: any;
  appVersion: string;
  deviceId: string;
  deviceName: string;
  edited?: boolean;
  lastEditedAt?: any;
  lastEditedBy?: string;
}

export interface InvoiceEdit {
  invoiceId: string;
  original: Invoice;
  updated: Invoice;
  editedBy: string;
  createdAt?: any;
}

export interface ShiftUser {
  id: string;
  name: string;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface DeviceRecord {
  id?: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  status: DeviceStatus;
  blockedReason?: string;
  graceUntil?: number;
  lastSeenAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface SystemSettings {
  id?: string;
  adminEmail: string;
  adminEmailSet: boolean;
  passwordConfiguredAt?: any;
  defaultLanguage: 'ar' | 'en';
  defaultTheme: 'dark' | 'light';
  company: string;
  exportMeta: {
    lastDailyKey?: string;
    lastMonthlyKey?: string;
  };
}
