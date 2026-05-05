'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Account, ExchangeRate, CURRENCY_SYMBOLS } from '@/types';
import { computeMetrics, formatCurrency } from '@/lib/utils';
import AIAnalysisPanel from './AIAnalysisPanel';

interface Props { month: string }

interface RateState { GBP_ILS: string; USD_ILS: string }

function toILS(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === 'ILS') return amount;
  const rate = rates[`${currency}_ILS`] ?? 1;
  return amount * rate;
}

export default function ConsolidatedView({ month }: Props) {
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [rates, setRates] = useState<RateState>({ GBP_ILS: '4.72', USD_ILS: '3.73' });
  const [editingRates, setEditingRates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingRates, setSavingRates] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [gbp, ils, usd, ratesRes] = await Promise.all([
        fetch(`/api/accounts?currency=GBP&month=${month}`).then(r => r.json()),
        fetch(`/api/accounts?currency=ILS&month=${month}`).then(r => r.json()),
        fetch(`/api/accounts?currency=USD&month=${month}`).then(r => r.json()),
        fetch('/api/exchange-rates').then(r => r.json()),
      ]);
      setAccounts({ GBP: gbp, ILS: ils, USD: usd });
      const rateMap: Record<string, string> = {};
      for (const r of ratesRes as ExchangeRate[]) {
        rateMap[`${r.fromCurrency}_${r.toCurrency}`] = String(r.rate);
      }
      setRates({
        GBP_ILS: rateMap.GBP_ILS ?? '4.72',
        USD_ILS: rateMap.USD_ILS ?? '3.73',
      });
    } catch {
      setError('שגיאה בטעינת נתונים מאוחדים');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function saveRates() {
    setSavingRates(true);
    try {
      await fetch('/api/exchange-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GBP_ILS: parseFloat(rates.GBP_ILS),
          USD_ILS: parseFloat(rates.USD_ILS),
        }),
      });
      setEditingRates(false);
    } finally {
      setSavingRates(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">טוען נתונים מאוחדים...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 rounded-xl p-6 text-center text-rose-700">
        <p>{error}</p>
        <button onClick={fetchAll} className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-sm rounded-lg">
          נסה שוב
        </button>
      </div>
    );
  }

  const numRates = { GBP_ILS: parseFloat(rates.GBP_ILS) || 4.72, USD_ILS: parseFloat(rates.USD_ILS) || 3.73 };

  const perCurrency = (['GBP', 'ILS', 'USD'] as const).map(cur => {
    const txs = accounts[cur]?.transactions ?? [];
    const m = computeMetrics(txs);
    return {
      cur,
      symbol: CURRENCY_SYMBOLS[cur],
      metrics: m,
      incomeILS: toILS(m.totalIncome, cur, numRates),
      expensesILS: toILS(m.totalExpenses, cur, numRates),
      netILS: toILS(m.netCashflow, cur, numRates),
    };
  });

  const totalIncomeILS = perCurrency.reduce((s, c) => s + c.incomeILS, 0);
  const totalExpensesILS = perCurrency.reduce((s, c) => s + c.expensesILS, 0);
  const totalNetILS = totalIncomeILS - totalExpensesILS;
  const totalMargin = totalIncomeILS > 0 ? (totalNetILS / totalIncomeILS) * 100 : 0;

  const chartData = perCurrency.map(c => ({
    name: c.cur,
    'הכנסות': Math.round(c.incomeILS),
    'הוצאות': Math.round(c.expensesILS),
  }));

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-700">תצוגה מאוחדת — כל המטבעות ב-ILS</h2>

      {/* Exchange rates */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">שערי חליפין</h3>
          {!editingRates ? (
            <button
              onClick={() => setEditingRates(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ✏️ ערוך
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={saveRates}
                disabled={savingRates}
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingRates ? 'שומר...' : 'שמור'}
              </button>
              <button
                onClick={() => setEditingRates(false)}
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200"
              >
                ביטול
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-6 flex-wrap">
          {[
            { label: 'GBP → ILS', key: 'GBP_ILS' as const },
            { label: 'USD → ILS', key: 'USD_ILS' as const },
          ].map(({ label, key }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{label}:</span>
              {editingRates ? (
                <input
                  type="number"
                  value={rates[key]}
                  onChange={e => setRates(r => ({ ...r, [key]: e.target.value }))}
                  className="ltr-field border border-gray-300 rounded-lg px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  step="0.01"
                  min="0"
                />
              ) : (
                <span className="text-sm font-semibold text-indigo-700">{rates[key]}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Combined totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'סה״כ הכנסות (ILS)', value: formatCurrency(totalIncomeILS, 'ILS'), color: 'text-emerald-600', icon: '📈' },
          { label: 'סה״כ הוצאות (ILS)', value: formatCurrency(totalExpensesILS, 'ILS'), color: 'text-rose-600', icon: '📉' },
          {
            label: 'תזרים נטו (ILS)',
            value: `${totalNetILS >= 0 ? '+' : ''}${formatCurrency(totalNetILS, 'ILS')}`,
            color: totalNetILS >= 0 ? 'text-indigo-600' : 'text-rose-600',
            icon: totalNetILS >= 0 ? '✅' : '⚠️',
          },
          { label: 'שולי רווח כולל', value: `${totalMargin.toFixed(1)}%`, color: totalMargin >= 20 ? 'text-emerald-600' : totalMargin >= 0 ? 'text-amber-500' : 'text-rose-600', icon: '💹' },
        ].map(c => (
          <div key={c.label} className="card p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{c.label}</span>
              <span className="text-2xl">{c.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Per-currency breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {perCurrency.map(c => (
          <div key={c.cur} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-700">{c.cur} {c.symbol}</span>
              <span className={`text-sm font-medium ${c.netILS >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {c.netILS >= 0 ? '+' : ''}{formatCurrency(c.netILS, 'ILS')}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>הכנסות ({c.cur})</span>
                <span className="text-emerald-600 font-medium">
                  {c.symbol}{c.metrics.totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>הוצאות ({c.cur})</span>
                <span className="text-rose-600 font-medium">
                  {c.symbol}{c.metrics.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5 mt-1">
                <span>שווי ILS</span>
                <span className="text-indigo-600 font-semibold">
                  ₪{Math.round(c.incomeILS).toLocaleString()} / ₪{Math.round(c.expensesILS).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">השוואת מטבעות (שווי ILS)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#475569', fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `₪${(v/1000).toFixed(0)}K`} width={64} />
            <Tooltip
              formatter={(value: number) => [`₪${value.toLocaleString()}`, '']}
              contentStyle={{ fontFamily: 'inherit', direction: 'rtl' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="הכנסות" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="הוצאות" fill="#f43f5e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI analysis */}
      <AIAnalysisPanel currency="CONSOLIDATED" month={month} />
    </div>
  );
}
