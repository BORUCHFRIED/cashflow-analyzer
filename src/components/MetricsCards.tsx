'use client';
import { Metrics } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  metrics: Metrics;
  currency: string;
}

function Card({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

export default function MetricsCards({ metrics, currency }: Props) {
  const { totalIncome, totalExpenses, netCashflow, profitMargin } = metrics;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        label="סה״כ הכנסות"
        value={formatCurrency(totalIncome, currency)}
        color="text-emerald-600"
        icon="📈"
      />
      <Card
        label="סה״כ הוצאות"
        value={formatCurrency(totalExpenses, currency)}
        color="text-rose-600"
        icon="📉"
      />
      <Card
        label="תזרים נטו"
        value={`${netCashflow >= 0 ? '+' : ''}${formatCurrency(netCashflow, currency)}`}
        color={netCashflow >= 0 ? 'text-indigo-600' : 'text-rose-600'}
        icon={netCashflow >= 0 ? '✅' : '⚠️'}
      />
      <Card
        label="שולי רווח"
        value={`${profitMargin.toFixed(1)}%`}
        sub={profitMargin >= 20 ? 'בריא' : profitMargin >= 0 ? 'גבולי' : 'הפסד'}
        color={profitMargin >= 20 ? 'text-emerald-600' : profitMargin >= 0 ? 'text-amber-500' : 'text-rose-600'}
        icon="💹"
      />
    </div>
  );
}
