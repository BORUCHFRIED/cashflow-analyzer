'use client';
import { useState } from 'react';
import { Transaction, AnalysisMode } from '@/types';

const MODES: { key: AnalysisMode; label: string; icon: string }[] = [
  { key: 'full',    label: 'ניתוח מלא',         icon: '🔍' },
  { key: 'savings', label: 'המלצות חיסכון',      icon: '💰' },
  { key: 'risk',    label: 'זיהוי סיכונים',      icon: '⚠️' },
];

interface Props {
  transactions: Transaction[];
  currency: string;
  extraContext?: string;
}

export default function AIAnalysisPanel({ transactions, currency, extraContext }: Props) {
  const [mode, setMode] = useState<AnalysisMode>('full');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runAnalysis(selectedMode: AnalysisMode) {
    setMode(selectedMode);
    setText('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          mode: selectedMode,
          currency,
          extraContext,
        }),
      });

      if (!res.ok || !res.body) {
        setError('שגיאה בקבלת ניתוח מ-AI');
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText(prev => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setError('שגיאת חיבור לשרת');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">ניתוח AI</h3>
        <span className="text-xs text-gray-400">מופעל על ידי Claude</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => runAnalysis(m.key)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${mode === m.key && (text || loading)
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && !text && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
          <span>מנתח נתונים...</span>
        </div>
      )}

      {text && (
        <div className="bg-gray-50 rounded-xl p-4 max-h-80 overflow-y-auto">
          <p className="streaming-text text-sm text-gray-800 leading-relaxed">{text}</p>
          {loading && (
            <span className="inline-block w-1.5 h-4 bg-indigo-500 animate-pulse ms-1 align-middle" />
          )}
        </div>
      )}

      {!text && !loading && !error && (
        <p className="text-sm text-gray-400 text-center py-4">
          בחר מצב ניתוח לקבלת תובנות AI
        </p>
      )}
    </div>
  );
}
