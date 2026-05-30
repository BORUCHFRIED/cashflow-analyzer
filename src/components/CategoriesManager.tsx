'use client';
import { useState } from 'react';
import { CategoryOption } from '@/hooks/useCategories';
import { CATEGORY_LABELS } from '@/types';

interface Props {
  options: CategoryOption[];
  custom: Array<{ id: string; name: string }>;
  addCategory: (name: string) => Promise<{ ok: boolean; error?: string }>;
  deleteCategory: (id: string) => void;
}

export default function CategoriesManager({ options, custom, addCategory, deleteCategory }: Props) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    setError('');
    const result = await addCategory(newName.trim());
    setSaving(false);
    if (result.ok) {
      setNewName('');
    } else {
      setError(result.error ?? 'Error');
    }
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🏷️</span>
          <span className="text-sm font-semibold text-gray-700">Manage Categories</span>
          {custom.length > 0 && (
            <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {custom.length} custom
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 flex flex-col gap-5">

          {/* Add new category */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500">Add New Category</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => { setNewName(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Category name (e.g. Travel & Fuel, Clothing)"
                dir="auto"
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || saving}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                {saving ? '...' : '+ Add'}
              </button>
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </div>

          {/* Built-in categories (read-only) */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Built-in Categories:</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CATEGORY_LABELS)
                .filter(([k]) => k !== '')
                .map(([key, label]) => (
                  <span key={key}
                    className="inline-block bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                    {label}
                  </span>
                ))}
            </div>
          </div>

          {/* Custom categories */}
          {custom.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Custom Categories:</p>
              <div className="flex flex-wrap gap-2">
                {custom.map(c => (
                  <div key={c.id}
                    className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-800 text-xs px-3 py-1.5 rounded-full">
                    <span>{c.name}</span>
                    <button
                      onClick={() => deleteCategory(c.id)}
                      className="text-purple-400 hover:text-rose-500 transition-colors leading-none font-bold"
                      title="Delete category"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                * Deleting a category will not change transactions already classified under it
              </p>
            </div>
          )}

          {custom.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-1">
              No custom categories yet
            </p>
          )}

          {/* Full merged list preview */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">
              All Available Categories ({options.length}):
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {options.map(o => o.label).join(' · ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
