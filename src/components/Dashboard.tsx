'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CURRENCY_SYMBOLS } from '@/types';
import { currentMonth, monthLabel } from '@/lib/utils';
import MonthSelector from './MonthSelector';
import AccountView from './AccountView';
import ConsolidatedView from './ConsolidatedView';

type Tab = 'GBP' | 'ILS' | 'USD' | 'CONSOLIDATED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ILS', label: `${CURRENCY_SYMBOLS.ILS} ILS — שקל` },
  { key: 'GBP', label: `${CURRENCY_SYMBOLS.GBP} GBP — פאונד` },
  { key: 'USD', label: `${CURRENCY_SYMBOLS.USD} USD — דולר` },
  { key: 'CONSOLIDATED', label: '🌐 כולל' },
];

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth);
  const [tab, setTab] = useState<Tab>('ILS');
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                📊 ניתוח תזרים מזומנים
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">ניהול פיננסי רב-מטבעי</p>
            </div>
            <div className="flex items-center gap-3">
              <MonthSelector month={month} onChange={setMonth} />
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="התנתק"
              >
                🚪 יציאה
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-shrink-0 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${tab === t.key
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4 text-xs text-gray-400">
          מציג נתונים עבור: {monthLabel(month)}
        </div>

        {tab === 'CONSOLIDATED' ? (
          <ConsolidatedView month={month} />
        ) : (
          <AccountView currency={tab} month={month} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100 mt-8">
        ניתוח תזרים מזומנים | מופעל על ידי Claude AI
      </footer>
    </div>
  );
}
