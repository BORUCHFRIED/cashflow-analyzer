'use client';
import { useState, useRef } from 'react';
import { parseCSV } from '@/lib/utils';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
}

interface Props {
  currency: string;
  month: string;
  onClose: () => void;
  onSuccess: () => void;
}

type AmountMode = 'auto' | 'all-expenses' | 'all-income' | 'flip';

export default function UploadModal({ currency, month, onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<'file' | 'paste'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [rawPreview, setRawPreview] = useState<ParsedRow[]>([]);
  const [amountMode, setAmountMode] = useState<AmountMode>('auto');
  const [parseError, setParseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function applyMode(rows: ParsedRow[], mode: AmountMode): ParsedRow[] {
    return rows.map(r => {
      switch (mode) {
        case 'all-expenses': return { ...r, amount: -Math.abs(r.amount) };
        case 'all-income':   return { ...r, amount:  Math.abs(r.amount) };
        case 'flip':         return { ...r, amount: -r.amount };
        default:             return r;
      }
    });
  }

  const preview = applyMode(rawPreview, amountMode);

  function parseText(text: string) {
    setParseError('');
    try {
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setParseError('לא זוהו שורות תקינות. פורמט: תאריך, תיאור, סכום');
        return;
      }
      setRawPreview(rows);
    } catch {
      setParseError('שגיאה בניתוח הנתונים');
    }
  }

  function handleFileRead(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setPasteText(text);
      parseText(text);
    };
    reader.readAsText(file, 'UTF-8');
  }

  async function handleSubmit() {
    if (preview.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency, transactions: preview, month }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'שגיאה בשמירת עסקאות');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError('שגיאת חיבור לשרת');
    } finally {
      setLoading(false);
    }
  }

  const MODES: { key: AmountMode; label: string; desc: string }[] = [
    { key: 'auto',         label: 'אוטומטי',       desc: 'שמור סכומים כפי שהם (+ הכנסה, - הוצאה)' },
    { key: 'all-expenses', label: 'כולן הוצאות',    desc: 'כל הסכומים הן הוצאות (יהפכו לשליליים)' },
    { key: 'all-income',   label: 'כולן הכנסות',    desc: 'כל הסכומים הן הכנסות (יהפכו לחיוביים)' },
    { key: 'flip',         label: 'הפוך סימנים',    desc: 'הפוך + ל- ו- ל+' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            העלאת עסקאות — {currency}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex gap-2">
            {(['paste', 'file'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setRawPreview([]); setParseError(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {t === 'paste' ? '📋 הדבק נתונים' : '📁 העלאת קובץ'}
              </button>
            ))}
          </div>

          {/* Format hint */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <strong>פורמט:</strong> תאריך, תיאור, סכום — מופרד בפסיקים<br />
            <span className="font-mono text-blue-500">01/03/2026, שכירות, 2100</span><br />
            <span className="font-mono text-blue-500">05/03/2026, תשלום לקוח, 8500</span>
          </div>

          {tab === 'paste' ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={pasteText}
                onChange={e => { setPasteText(e.target.value); setRawPreview([]); }}
                placeholder="הדבק נתוני בנק כאן..."
                className="border border-gray-300 rounded-xl p-3 text-sm font-mono h-40 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                dir="ltr"
              />
              <button
                onClick={() => parseText(pasteText)}
                disabled={!pasteText.trim()}
                className="self-start px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-40"
              >
                נתח נתונים
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileRead}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-medium hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
          )}

          {parseError && (
            <div className="bg-rose-50 text-rose-600 text-sm rounded-lg p-3">{parseError}</div>
          )}

          {/* Amount mode selector — shown once we have parsed rows */}
          {rawPreview.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-amber-800">סוג הסכומים בקובץ:</p>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setAmountMode(m.key)}
                    className={`text-right px-3 py-2 rounded-lg border text-xs transition-colors
                      ${amountMode === m.key
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-100'
                      }`}
                  >
                    <div className="font-semibold">{m.label}</div>
                    <div className={`mt-0.5 ${amountMode === m.key ? 'text-amber-100' : 'text-amber-600'}`}>
                      {m.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                תצוגה מקדימה — {preview.length} עסקאות
              </h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-right text-gray-500">תאריך</th>
                      <th className="px-3 py-2 text-right text-gray-500">תיאור</th>
                      <th className="px-3 py-2 text-left text-gray-500">סכום</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.slice(0, 20).map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 text-gray-600 font-mono" dir="ltr">
                          {new Date(row.date).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-3 py-1.5 text-gray-800" dir="auto">{row.description}</td>
                        <td className={`px-3 py-1.5 font-medium font-mono text-left ${row.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {row.amount >= 0 ? '+' : ''}{row.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 20 && (
                <p className="text-xs text-gray-400 mt-1">...ועוד {preview.length - 20} עסקאות</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 text-rose-600 text-sm rounded-lg p-3">{error}</div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              disabled={preview.length === 0 || loading}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'שומר...' : `שמור ${preview.length} עסקאות`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
