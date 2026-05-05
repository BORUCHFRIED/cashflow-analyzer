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
          <span className="text-sm font-semibold text-gray-700">הוראות קבועות ל-AI</span>
          {saved.trim() && (
            <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
              פעיל
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 flex flex-col gap-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            כתוב כאן כל הקשר עסקי שה-AI צריך לדעת תמיד — כללי חשבונאות, מועדי תשלום, איך לסווג עסקאות מסוימות וכו׳.
            ההוראות יוזנו אוטומטית לכל שיחה עם ה-AI.
          </p>
          <textarea
            value={instructions}
            onChange={e => onChange(e.target.value)}
            dir="auto"
            rows={7}
            placeholder={`לדוגמה:
• משכורות משולמות ב-5 לחודש הבא — הן שייכות לחודש הקודם כהוצאה
• תשלומים לספק "כהן חומרים" הם תמיד עלות ייצור, לא הוצאות כלליות
• הכנסה מ"פרויקט X" מחולקת שווה-בשווה על פני 3 חודשים
• מע"מ משולם כל חודשיים — אל תחשב אותו כהוצאה חודשית רגילה`}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {instructions.length} תווים
            </p>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {saving ? 'שומר...' : dirty ? '💾 שמור הוראות' : '✓ שמור'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
