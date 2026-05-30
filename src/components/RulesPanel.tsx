'use client';
import { useState, useEffect } from 'react';
import { CategoryRule } from '@/types';
import { CategoryOption } from '@/hooks/useCategories';

interface Props {
  accountId: string;
  month: string;
  onApplied: () => void;
  categoryOptions: CategoryOption[];
}

export default function RulesPanel({ accountId, month, onApplied, categoryOptions }: Props) {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [keyword, setKeyword] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetch('/api/rules').then(r => r.json()).then(setRules).catch(() => {});
  }, []);

  async function addRule() {
    setFormError('');
    if (!category) { setFormError('Select a category'); return; }
    if (!keyword.trim() && !minAmount && !maxAmount) {
      setFormError('Add at least a keyword or amount range');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          minAmount: minAmount !== '' ? Number(minAmount) : null,
          maxAmount: maxAmount !== '' ? Number(maxAmount) : null,
          category,
        }),
      });
      if (res.ok) {
        const rule = await res.json();
        setRules(prev => [...prev, rule]);
        setKeyword(''); setMinAmount(''); setMaxAmount(''); setCategory('');
      } else {
        const d = await res.json();
        setFormError(d.error ?? 'Error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteRule(id: string) {
    await fetch(`/api/rules/${id}`, { method: 'DELETE' });
    setRules(prev => prev.filter(r => r.id !== id));
  }

  async function applyRules() {
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await fetch('/api/rules/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, month }),
      });
      const data = await res.json();
      setApplyResult(
        data.matched > 0
          ? `✅ ${data.matched} transactions classified by rules`
          : 'No uncategorized transactions matched the rules'
      );
      if (data.matched > 0) onApplied();
    } finally {
      setApplying(false);
    }
  }

  function ruleLabel(r: CategoryRule) {
    const parts: string[] = [];
    if (r.keyword) parts.push(`"${r.keyword}"`);
    if (r.minAmount != null || r.maxAmount != null) {
      const min = r.minAmount != null ? r.minAmount.toLocaleString() : '0';
      const max = r.maxAmount != null ? r.maxAmount.toLocaleString() : '∞';
      parts.push(`${min}–${max}`);
    }
    return parts.join(' + ');
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">⚙️</span>
          <span className="text-sm font-semibold text-gray-700">Auto-Classification Rules</span>
          {rules.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {rules.length} rules
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 flex flex-col gap-5">

          {/* Add rule form */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-gray-500">
              Define a rule: description contains keyword <strong>and/or</strong> amount in range → category
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Keyword (e.g. salary, aws, rent)"
                dir="auto"
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Select category</option>
                {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500 whitespace-nowrap">Amount from:</span>
                <input
                  type="number"
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  placeholder="Minimum"
                  min="0"
                  className="ltr-field flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500 whitespace-nowrap">To:</span>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  placeholder="Maximum"
                  min="0"
                  className="ltr-field flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            {formError && <p className="text-xs text-rose-600">{formError}</p>}

            <button
              onClick={addRule}
              disabled={!category || loading}
              className="self-start px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              + Add Rule
            </button>
          </div>

          {/* Rules list */}
          {rules.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Active rules:</p>
              <div className="flex flex-wrap gap-2">
                {rules.map(rule => (
                  <div key={rule.id}
                    className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-mono font-semibold text-indigo-700">
                      {ruleLabel(rule)}
                    </span>
                    <span className="text-gray-400 text-xs">→</span>
                    <span className="text-xs text-indigo-600">
                      {categoryOptions.find(o => o.value === rule.category)?.label ?? rule.category}
                    </span>
                    <button onClick={() => deleteRule(rule.id)}
                      className="text-gray-400 hover:text-rose-500 transition-colors text-sm leading-none" title="Delete rule">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">No rules yet. Add the first one above.</p>
          )}

          {/* Apply */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-gray-100">
            <p className="text-xs text-gray-500">Apply rules to uncategorized transactions this month</p>
            <button
              onClick={applyRules}
              disabled={applying || rules.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {applying
                ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Applying...</>
                : '▶ Apply Rules'}
            </button>
          </div>

          {applyResult && (
            <div className={`text-sm rounded-xl px-4 py-2.5 text-center ${applyResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>
              {applyResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
