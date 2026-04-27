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
  'Staff & Salaries': 'שכר ועובדים',
  'Rent & Office': 'שכירות ומשרד',
  'Marketing & Ads': 'שיווק ופרסום',
  'Suppliers & Materials': 'ספקים וחומרים',
  'Infrastructure & Software': 'תשתיות ותוכנה',
  'Sales Revenue': 'הכנסות ממכירות',
  'Service Revenue': 'הכנסות משירותים',
  'Loans & Finance': 'הלוואות ומימון',
  'Taxes & Compliance': 'מסים ורגולציה',
  'General Expenses': 'הוצאות כלליות',
  'Other': 'אחר',
  '': 'ללא קטגוריה',
};

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  month: string;
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
