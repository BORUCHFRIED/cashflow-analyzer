'use client';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { Metrics } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  metrics: Metrics;
  currency: string;
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}

function MetricCard({ label, value, sub, trend, Icon, iconBg, iconColor, valueColor }: CardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        {trend && trend !== 'neutral' && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
          }`}>
            {trend === 'up'
              ? <ArrowUpRight size={12} />
              : <ArrowDownRight size={12} />}
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="metric-label mb-1">{label}</p>
        <p className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${valueColor ?? ''}`}
          style={!valueColor ? { color: 'var(--text-primary)' } : {}}>
          {value}
        </p>
        {sub && trend === 'neutral' && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

export default function MetricsCards({ metrics, currency }: Props) {
  const { totalIncome, totalExpenses, netCashflow, profitMargin } = metrics;
  const marginStatus = profitMargin >= 20 ? 'up' : profitMargin >= 0 ? 'neutral' : 'down';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Income"
        value={formatCurrency(totalIncome, currency)}
        sub="Gross Income"
        trend="neutral"
        Icon={TrendingUp}
        iconBg="bg-emerald-50 dark:bg-emerald-900/30"
        iconColor="text-emerald-600"
        valueColor="text-emerald-600"
      />
      <MetricCard
        label="Total Expenses"
        value={formatCurrency(totalExpenses, currency)}
        sub="Total Outgoings"
        trend="neutral"
        Icon={TrendingDown}
        iconBg="bg-rose-50 dark:bg-rose-900/30"
        iconColor="text-rose-600"
        valueColor="text-rose-600"
      />
      <MetricCard
        label="Net Cash Flow"
        value={`${netCashflow >= 0 ? '+' : ''}${formatCurrency(netCashflow, currency)}`}
        trend={netCashflow >= 0 ? 'neutral' : 'neutral'}
        sub={netCashflow >= 0 ? 'Positive' : 'Negative'}
        Icon={netCashflow >= 0 ? ArrowUpRight : ArrowDownRight}
        iconBg={netCashflow >= 0 ? 'bg-brand-50 dark:bg-brand-900/30' : 'bg-rose-50 dark:bg-rose-900/30'}
        iconColor={netCashflow >= 0 ? 'text-brand-600' : 'text-rose-600'}
        valueColor={netCashflow >= 0 ? 'text-brand-600' : 'text-rose-600'}
      />
      <MetricCard
        label="Profit Margin"
        value={`${profitMargin.toFixed(1)}%`}
        sub={profitMargin >= 20 ? 'Healthy' : profitMargin >= 0 ? 'Marginal' : 'Loss'}
        trend={marginStatus}
        Icon={Percent}
        iconBg={profitMargin >= 20 ? 'bg-emerald-50 dark:bg-emerald-900/30' : profitMargin >= 0 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-rose-50 dark:bg-rose-900/30'}
        iconColor={profitMargin >= 20 ? 'text-emerald-600' : profitMargin >= 0 ? 'text-amber-500' : 'text-rose-600'}
        valueColor={profitMargin >= 20 ? 'text-emerald-600' : profitMargin >= 0 ? 'text-amber-500' : 'text-rose-600'}
      />
    </div>
  );
}
