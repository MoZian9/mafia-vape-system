import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import type { Invoice } from '../types';

const EMPTY_ROW = {
  invoiceNumber: '',
  createdAt: '',
  employee: '',
  paymentMethod: '',
  category: '',
  saleType: '',
  sourceLocation: '',
  brand: '',
  model: '',
  flavor: '',
  nicotine: '',
  name: '',
  quantity: '',
  price: '',
  total: '',
  notes: '',
  device: '',
  appVersion: '',
  edited: ''
};

function linesToRows(invoices: Invoice[]) {
  const rows: any[] = [];
  invoices.forEach((invoice) => {
    invoice.lines.forEach((line) => {
      rows.push({
        invoiceNumber: invoice.invoiceNumber,
        createdAt: dayjs(invoice.createdAtMs).format('YYYY-MM-DD HH:mm:ss'),
        employee: invoice.employeeName,
        paymentMethod: invoice.paymentMethod,
        category: line.category,
        saleType: line.saleType,
        sourceLocation: line.sourceLocation || '',
        brand: line.brand,
        model: line.model || '',
        flavor: line.flavor || '',
        nicotine: line.nicotine || '',
        name: line.name,
        quantity: line.quantity,
        price: line.price,
        total: line.total,
        notes: invoice.notes,
        device: invoice.deviceName,
        appVersion: invoice.appVersion,
        edited: invoice.edited ? 'yes' : 'no'
      });
    });
  });
  return rows;
}

function buildSheet(rows: any[]) {
  return XLSX.utils.json_to_sheet(rows.length ? rows : [EMPTY_ROW]);
}

export function buildDailyWorkbook(dateKey: string, invoices: Invoice[]) {
  const wb = XLSX.utils.book_new();
  const rows = linesToRows(invoices);
  XLSX.utils.book_append_sheet(wb, buildSheet(rows), dateKey);
  return wb;
}

export function buildMonthlyWorkbook(monthKey: string, invoices: Invoice[]) {
  const wb = XLSX.utils.book_new();
  const grouped = new Map<string, Invoice[]>();
  invoices.forEach((invoice) => {
    const key = dayjs(invoice.createdAtMs).format('YYYY-MM-DD');
    grouped.set(key, [...(grouped.get(key) || []), invoice]);
  });
  if (!grouped.size) {
    XLSX.utils.book_append_sheet(wb, buildSheet([]), monthKey);
    return wb;
  }
  for (const [date, list] of grouped.entries()) {
    const rows = linesToRows(list);
    XLSX.utils.book_append_sheet(wb, buildSheet(rows), date);
  }
  return wb;
}

export function workbookToArrayBuffer(workbook: XLSX.WorkBook) {
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}
