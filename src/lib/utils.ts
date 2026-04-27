import { Transaction, Metrics, CURRENCY_SYMBOLS, Currency } from '@/types';

export function computeMetrics(transactions: Transaction[]): Metrics {
  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netCashflow = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;
  return { totalIncome, totalExpenses, netCashflow, profitMargin };
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${symbol}${formatted}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

export function parseDate(str: string): Date | null {
  // Supports: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  const parts = str.trim().split(/[\/\-\.]/);
  if (parts.length !== 3) return null;

  let y: number, m: number, da: number;

  if (parts[0].length === 4) {
    [y, m, da] = parts.map(Number);
  } else if (parseInt(parts[1]) > 12) {
    [da, m, y] = parts.map(Number);
    if (y < 100) y += 2000;
  } else {
    [da, m, y] = parts.map(Number);
    if (y < 100) y += 2000;
  }

  const date = new Date(y, m - 1, da);
  return isNaN(date.getTime()) ? null : date;
}

export function parseCSV(raw: string): Array<{ date: string; description: string; amount: number }> {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  const results: Array<{ date: string; description: string; amount: number }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split by comma, but keep quoted fields intact
    const parts = trimmed.match(/(".*?"|[^,]+)(?:,|$)/g)?.map(p =>
      p.replace(/,$/, '').replace(/^"|"$/g, '').trim()
    ) ?? trimmed.split(',').map(p => p.trim());

    if (parts.length < 3) continue;

    const dateStr = parts[0];
    const description = parts.slice(1, -1).join(', ');
    const amountStr = parts[parts.length - 1].replace(/[£$₪,\s]/g, '');
    const amount = parseFloat(amountStr);

    if (isNaN(amount)) continue;

    const date = parseDate(dateStr);
    if (!date) continue;

    results.push({
      date: date.toISOString(),
      description,
      amount,
    });
  }

  return results;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const hebrewMonths = [
    'ינואר','פברואר','מרץ','אפריל','מאי','יוני',
    'יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר',
  ];
  return `${hebrewMonths[m - 1]} ${y}`;
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function exportToCSV(transactions: Transaction[], currency: string, month: string): void {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency;
  const header = 'תאריך,תיאור,סכום,קטגוריה\n';
  const rows = transactions.map(t =>
    `${formatDate(t.date)},"${t.description}",${t.amount > 0 ? '' : '-'}${symbol}${Math.abs(t.amount).toFixed(2)},${t.category}`
  ).join('\n');
  const csv = '﻿' + header + rows; // BOM for Excel Hebrew support
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cashflow_${currency}_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
