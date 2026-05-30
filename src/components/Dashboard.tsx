'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote, PoundSterling, DollarSign, Globe,
  LogOut, Moon, Sun, Menu, X, TrendingUp,
} from 'lucide-react';
import { CURRENCY_SYMBOLS } from '@/types';
import { currentMonth, monthLabel } from '@/lib/utils';
import MonthSelector from './MonthSelector';
import AccountView from './AccountView';
import ConsolidatedView from './ConsolidatedView';

type Tab = 'GBP' | 'ILS' | 'USD' | 'CONSOLIDATED';

const TABS: { key: Tab; label: string; sub: string; Icon: React.ElementType }[] = [
  { key: 'ILS',          label: 'Israeli Shekel',    sub: `₪ ILS`,           Icon: Banknote       },
  { key: 'GBP',          label: 'British Pound',     sub: `£ GBP`,           Icon: PoundSterling  },
  { key: 'USD',          label: 'US Dollar',         sub: `$ USD`,           Icon: DollarSign     },
  { key: 'CONSOLIDATED', label: 'Consolidated View', sub: 'All Currencies',  Icon: Globe          },
];

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth);
  const [tab, setTab] = useState<Tab>('ILS');
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const activeTab = TABS.find(t => t.key === tab)!;

  return (
    /* Outer shell */
    <div className="flex h-screen overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64
        transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'var(--sidebar-bg)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">CashFlow</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Financial Analysis</p>
          </div>
        </div>

        {/* Month selector in sidebar */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-xs mb-2 px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Month</p>
          <MonthSelector month={month} onChange={setMonth} dark />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-xs px-3 mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Accounts</p>
          {TABS.map(({ key, label, sub, Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSidebarOpen(false); }}
              className={`sidebar-item ${tab === key ? 'active' : ''}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm leading-none">{label}</p>
                <p className="text-xs mt-0.5 opacity-60">{sub}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button onClick={toggleDark} className="sidebar-item">
            {dark ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
            <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={handleLogout} className="sidebar-item" style={{ color: 'rgba(239,68,68,0.8)' }}>
            <LogOut size={18} className="flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 flex-shrink-0 border-b"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              style={{ color: 'var(--text-secondary)' }}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
                {activeTab.label}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {monthLabel(month)}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ background: 'var(--bg)' }}>
          <div className="max-w-7xl mx-auto">
            {tab === 'CONSOLIDATED'
              ? <ConsolidatedView month={month} />
              : <AccountView currency={tab} month={month} />
            }
          </div>
        </main>
      </div>
    </div>
  );
}
