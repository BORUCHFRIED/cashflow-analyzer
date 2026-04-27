'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Transaction, CATEGORY_LABELS } from '@/types';

const COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316',
  '#eab308','#22c55e','#06b6d4','#3b82f6','#14b8a6','#a855f7',
];

interface Props {
  transactions: Transaction[];
  currency: string;
}

export default function CategoryChart({ transactions, currency }: Props) {
  const expenses = transactions.filter(t => t.amount < 0);

  const grouped: Record<string, number> = {};
  for (const t of expenses) {
    const key = t.category || 'Other';
    grouped[key] = (grouped[key] ?? 0) + Math.abs(t.amount);
  }

  const data = Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      name: CATEGORY_LABELS[category] ?? category,
      amount: Math.round(amount),
    }));

  if (data.length === 0) {
    return (
      <div className="card p-5 flex items-center justify-center h-48 text-gray-400 text-sm">
        אין הוצאות להצגה
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-600 mb-4">הוצאות לפי קטגוריה</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={v => `${v.toLocaleString()}`}
            width={60}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString()} ${currency}`, 'סכום']}
            contentStyle={{ fontFamily: 'inherit', direction: 'rtl' }}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
