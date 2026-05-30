'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Account, Transaction } from '@/types';
import { computeMetrics, exportToCSV } from '@/lib/utils';
import MetricsCards from './MetricsCards';
import TransactionTable from './TransactionTable';
import CategoryChart from './CategoryChart';
import AIAnalysisPanel from './AIAnalysisPanel';
import UploadModal from './UploadModal';
import RulesPanel from './RulesPanel';
import CategoriesManager from './CategoriesManager';
import { useCategories } from '@/hooks/useCategories';
import AIContextPanel from './AIContextPanel';

interface Props {
  currency: string;
  month: string;
}

interface UndoState {
  transactions: Transaction[];
  label: string;
}

export default function AccountView({ currency, month }: Props) {
  const { options: categoryOptions, custom: customCategories, addCategory, deleteCategory } = useCategories();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/accounts?currency=${currency}&month=${month}`);
      if (!res.ok) throw new Error('שגיאה בטעינת נתונים');
      const data = await res.json();
      setAccount(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  }, [currency, month]);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  // Clear undo timer on unmount
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  function scheduleUndoClear() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoState(null), 6000);
  }

  async function handleUpdate(id: string, data: Partial<Transaction>) {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const updated: Transaction = await res.json();
      setAccount(prev => prev ? {
        ...prev,
        transactions: prev.transactions.map(t => t.id === id ? updated : t),
      } : prev);
    } catch { /* silent */ }
  }

  async function handleDelete(id: string) {
    if (!confirm('האם למחוק עסקה זו?')) return;
    const removed = account?.transactions.find(t => t.id === id);
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      setAccount(prev => prev ? {
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
      } : prev);
      if (removed) {
        setUndoState({ transactions: [removed], label: 'נמחקה עסקה אחת' });
        scheduleUndoClear();
      }
    } catch { /* silent */ }
  }

  async function handleDeleteMany(ids: string[]) {
    const removed = account?.transactions.filter(t => ids.includes(t.id)) ?? [];
    try {
      await Promise.all(ids.map(id => fetch(`/api/transactions/${id}`, { method: 'DELETE' })));
      setAccount(prev => prev ? {
        ...prev,
        transactions: prev.transactions.filter(t => !ids.includes(t.id)),
      } : prev);
      if (removed.length) {
        setUndoState({ transactions: removed, label: `נמחקו ${removed.length} עסקאות` });
        scheduleUndoClear();
      }
    } catch { /* silent */ }
  }

  async function handleUndo() {
    if (!undoState || !account) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          month,
          transactions: undoState.transactions.map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            category: t.category,
          })),
        }),
      });
      setUndoState(null);
      fetchAccount();
    } catch { /* silent */ }
  }

  async function handleClassify() {
    if (!account) return;
    const uncategorized = account.transactions.filter(t => !t.category);
    if (!uncategorized.length) return;
    setClassifying(true);
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: uncategorized }),
      });
      if (!res.ok) return;
      const { results } = await res.json() as { results: Array<{ id: string; category: string }> };
      setAccount(prev => {
        if (!prev) return prev;
        const map = Object.fromEntries(results.map(r => [r.id, r.category]));
        return {
          ...prev,
          transactions: prev.transactions.map(t =>
            map[t.id] ? { ...t, category: map[t.id] } : t
          ),
        };
      });
    } finally {
      setClassifying(false);
    }
  }

  async function handleClearMonth() {
    if (!account) return;
    if (!confirm(`האם למחוק את כל ${transactions.length} העסקאות של חודש זה? פעולה זו אינה הפיכה.`)) return;
    try {
      await fetch(`/api/transactions/clear?accountId=${account.id}&month=${month}`, { method: 'DELETE' });
      fetchAccount();
    } catch { /* silent */ }
  }

  async function handleExportPDF() {
    const el = exportRef.current;
    if (!el) return;
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    const canvas = await html2canvas(el, { scale: 1.5, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`cashflow_${currency}_${month}.pdf`);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        {/* Metric skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 flex flex-col gap-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-7 w-32 rounded" />
            </div>
          ))}
        </div>
        {/* Chart + AI skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5"><div className="skeleton h-52 w-full rounded-xl" /></div>
          <div className="card p-5"><div className="skeleton h-52 w-full rounded-xl" /></div>
        </div>
        {/* Table skeleton */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
        <p className="font-medium">שגיאה בטעינת נתונים</p>
        <p className="text-sm mt-1">{error}</p>
        <button onClick={fetchAccount} className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700">
          נסה שוב
        </button>
      </div>
    );
  }

  const transactions = account?.transactions ?? [];
  const metrics = computeMetrics(transactions);

  return (
    <div className="flex flex-col gap-5">
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-700">
          חשבון {currency} — {transactions.length} עסקאות
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            📤 העלאת עסקאות
          </button>
          <button
            onClick={() => exportToCSV(transactions, currency, month)}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            ⬇️ ייצוא CSV
          </button>
          <button
            onClick={handleClearMonth}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-rose-200 text-rose-600 text-sm font-medium rounded-xl hover:bg-rose-50 disabled:opacity-40 transition-colors"
          >
            🗑️ נקה חודש
          </button>
          <button
            onClick={handleExportPDF}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            📄 ייצוא PDF
          </button>
        </div>
      </div>

      <div ref={exportRef} className="flex flex-col gap-5">
        <MetricsCards metrics={metrics} currency={currency} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CategoryChart transactions={transactions} currency={currency} />
          <AIAnalysisPanel currency={currency} month={month} />
        </div>
        <AIContextPanel />
        <CategoriesManager
          options={categoryOptions}
          custom={customCategories}
          addCategory={addCategory}
          deleteCategory={deleteCategory}
        />
        {account && (
          <RulesPanel
            accountId={account.id}
            month={month}
            onApplied={fetchAccount}
            categoryOptions={categoryOptions}
          />
        )}
        <TransactionTable
          transactions={transactions}
          currency={currency}
          categoryOptions={categoryOptions}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onDeleteMany={handleDeleteMany}
          onClassify={handleClassify}
          classifying={classifying}
        />
      </div>

      {showUpload && (
        <UploadModal
          currency={currency}
          month={month}
          onClose={() => setShowUpload(false)}
          onSuccess={fetchAccount}
        />
      )}

      {/* Undo toast */}
      {undoState && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm animate-fade-in">
          <span>{undoState.label}</span>
          <button
            onClick={handleUndo}
            className="font-bold text-indigo-300 hover:text-indigo-100 underline underline-offset-2"
          >
            ביטול מחיקה ↩
          </button>
          <button
            onClick={() => { setUndoState(null); if (undoTimer.current) clearTimeout(undoTimer.current); }}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
