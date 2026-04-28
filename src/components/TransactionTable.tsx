'use client';
import { useState } from 'react';
import { Transaction, CATEGORIES, CATEGORY_LABELS } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

interface EditState {
  date: string;
  description: string;
  amount: string;
  category: string;
}

interface Props {
  transactions: Transaction[];
  currency: string;
  onUpdate: (id: string, data: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onClassify: () => void;
  classifying: boolean;
}

export default function TransactionTable({
  transactions, currency, onUpdate, onDelete, onDeleteMany, onClassify, classifying,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ date: '', description: '', amount: '', category: '' });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const uncategorized = transactions.filter(t => !t.category).length;
  const allSelected = transactions.length > 0 && selected.size === transactions.length;
  const someSelected = selected.size > 0;

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(transactions.map(t => t.id)));
  }

  function handleDeleteSelected() {
    if (!confirm(`האם למחוק ${selected.size} עסקאות?`)) return;
    onDeleteMany([...selected]);
    setSelected(new Set());
  }

  function startEdit(t: Transaction) {
    setEditingId(t.id);
    setEditState({
      date: t.date.slice(0, 10),
      description: t.description,
      amount: String(t.amount),
      category: t.category,
    });
  }

  function saveEdit(id: string) {
    const amount = parseFloat(editState.amount);
    if (isNaN(amount)) return;
    onUpdate(id, {
      date: new Date(editState.date).toISOString(),
      description: editState.description,
      amount,
      category: editState.category,
    });
    setEditingId(null);
  }

  if (transactions.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-400 text-sm">
        אין עסקאות לחודש זה. העלה קובץ CSV או הדבק נתוני בנק.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Table toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-700">
            עסקאות ({transactions.length})
          </h3>
          {someSelected && (
            <span className="text-xs text-indigo-600 font-medium">
              {selected.size} נבחרו
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {someSelected && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition-colors"
            >
              🗑️ מחק נבחרים ({selected.size})
            </button>
          )}
          {uncategorized > 0 && (
            <button
              onClick={onClassify}
              disabled={classifying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {classifying ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מסווג...
                </>
              ) : (
                <>✨ סיווג אוטומטי ({uncategorized})</>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                  title="בחר הכל"
                />
              </th>
              <th className="px-4 py-3 text-right">תאריך</th>
              <th className="px-4 py-3 text-right">תיאור</th>
              <th className="px-4 py-3 text-left">סכום</th>
              <th className="px-4 py-3 text-right">קטגוריה</th>
              <th className="px-4 py-3 text-center w-24">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map(t => (
              <tr
                key={t.id}
                className={`tx-row ${selected.has(t.id) ? 'bg-indigo-50' : ''}`}
              >
                {/* Checkbox */}
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </td>

                {editingId === t.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={editState.date}
                        onChange={e => setEditState(s => ({ ...s, date: e.target.value }))}
                        className="date-input border border-gray-300 rounded-md px-2 py-1 text-xs w-32"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editState.description}
                        onChange={e => setEditState(s => ({ ...s, description: e.target.value }))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs w-full min-w-[160px]"
                        dir="auto"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={editState.amount}
                        onChange={e => setEditState(s => ({ ...s, amount: e.target.value }))}
                        className="ltr-field border border-gray-300 rounded-md px-2 py-1 text-xs w-24"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editState.category}
                        onChange={e => setEditState(s => ({ ...s, category: e.target.value }))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                      >
                        <option value="">ללא קטגוריה</option>
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => saveEdit(t.id)}
                          className="px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600"
                        >שמור</button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                        >ביטול</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-800 max-w-[260px]">
                      <span dir="auto" className="block truncate">{t.description}</span>
                    </td>
                    <td className="px-4 py-2.5 ltr-field whitespace-nowrap font-medium">
                      <span className={t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount, currency)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {t.category ? (
                        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                          {CATEGORY_LABELS[t.category] ?? t.category}
                        </span>
                      ) : (
                        <span className="inline-block bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-full">
                          לא מסווג
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => startEdit(t)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="ערוך"
                        >✏️</button>
                        <button
                          onClick={() => onDelete(t.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="מחק"
                        >🗑️</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
