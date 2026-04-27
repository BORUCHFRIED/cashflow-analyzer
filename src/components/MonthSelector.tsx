'use client';
import { monthLabel, prevMonth, nextMonth } from '@/lib/utils';

interface Props {
  month: string;
  onChange: (month: string) => void;
}

export default function MonthSelector({ month, onChange }: Props) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
      <button
        onClick={() => onChange(nextMonth(month))}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 font-bold text-lg leading-none"
        title="חודש הבא"
      >
        ‹
      </button>
      <span className="text-base font-semibold text-gray-800 min-w-[130px] text-center select-none">
        {monthLabel(month)}
      </span>
      <button
        onClick={() => onChange(prevMonth(month))}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 font-bold text-lg leading-none"
        title="חודש קודם"
      >
        ›
      </button>
    </div>
  );
}
