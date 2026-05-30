'use client';
import { useState, useEffect } from 'react';

export default function AIContextPanel() {
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch('/api/ai-context')
      .then(r => r.json())
      .then(d => { setInstructions(d.instructions); setSaved(d.instructions); });
  }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/ai-context', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructions }),
    });
    setSaved(instructions);
    setDirty(false);
    setSaving(false);
  }

  function onChange(val: string) {
    setInstructions(val);
    setDirty(val !== saved);
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <span className="text-sm font-semibold text-gray-700">Persistent AI Instructions</span>
          {saved.trim() && (
            <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 flex flex-col gap-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Write any business context the AI should always know — accounting rules, payment schedules, how to classify certain transactions, etc.
            These instructions will be automatically fed into every AI conversation.
          </p>
          <textarea
            value={instructions}
            onChange={e => onChange(e.target.value)}
            dir="auto"
            rows={7}
            placeholder={`Examples:
• Salaries paid on the 5th belong to the previous month as an expense
• Payments to supplier "ABC Materials" are always production cost, not general expenses
• Income from "Project X" is split evenly across 3 months
• VAT is paid every 2 months — do not count it as a regular monthly expense`}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {instructions.length} characters
            </p>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving...' : dirty ? '💾 Save Instructions' : '✓ Saved'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
