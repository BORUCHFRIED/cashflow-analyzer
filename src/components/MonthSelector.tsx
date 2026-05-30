'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, prevMonth, nextMonth } from '@/lib/utils';

interface Props {
  month: string;
  onChange: (month: string) => void;
  dark?: boolean;
}

export default function MonthSelector({ month, onChange, dark }: Props) {
  const btnClass = dark
    ? 'p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors'
    : 'p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors';
  const textClass = dark
    ? 'text-sm font-semibold text-white min-w-[120px] text-center select-none'
    : 'text-sm font-semibold min-w-[130px] text-center select-none';

  return (
    <div className={`flex items-center gap-1 ${dark ? '' : 'bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-slate-700 shadow-card'}`}>
      {/* In RTL, ChevronRight = go to NEXT month (forward in time, displayed on left visually) */}
      <button onClick={() => onChange(nextMonth(month))} className={btnClass} title="חודש הבא">
        <ChevronRight size={16} />
      </button>
      <span className={textClass} style={dark ? {} : { color: 'var(--text-primary)' }}>
        {monthLabel(month)}
      </span>
      <button onClick={() => onChange(prevMonth(month))} className={btnClass} title="חודש קודם">
        <ChevronLeft size={16} />
      </button>
    </div>
  );
}
