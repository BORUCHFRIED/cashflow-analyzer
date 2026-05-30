export type Currency = 'GBP' | 'ILS' | 'USD';

export const CURRENCIES: Currency[] = ['GBP', 'ILS', 'USD'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  ILS: '₪',
  USD: '$',
};

export const CATEGORIES = [
  'Staff & Salaries',
  'Rent & Office',
  'Marketing & Ads',
  'Suppliers & Materials',
  'Infrastructure & Software',
  'Sales Revenue',
  'Service Revenue',
  'Loans & Finance',
  'Taxes & Compliance',
  'General Expenses',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<string, string> = {
  'Staff & Salaries': 'Staff & Salaries',
  'Rent & Office': 'Rent & Office',
  'Marketing & Ads': 'Marketing & Ads',
  'Suppliers & Materials': 'Suppliers & Materials',
  'Infrastructure & Software': 'Infrastructure & Software',
  'Sales Revenue': 'Sales Revenue',
  'Service Revenue': 'Service Revenue',
  'Loans & Finance': 'Loans & Finance',
  'Taxes & Compliance': 'Taxes & Compliance',
  'General Expenses': 'General Expenses',
  'Other': 'Other',
  '': 'No Category',
};

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  notes: string;
  month: string;
}

export interface CategoryRule {
  id: string;
  keyword: string;
  minAmount: number | null;
  maxAmount: number | null;
  category: string;
}

export interface Account {
  id: string;
  currency: string;
  transactions: Transaction[];
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

export interface Metrics {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  profitMargin: number;
}

export type AnalysisMode = 'full' | 'savings' | 'risk';
