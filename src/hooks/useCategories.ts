'use client';
import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES, CATEGORY_LABELS } from '@/types';

export interface CategoryOption {
  value: string;   // stored in DB
  label: string;   // shown in UI
  isCustom: boolean;
}

export function useCategories() {
  const [custom, setCustom] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCustom(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const options: CategoryOption[] = [
    ...CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c], isCustom: false })),
    ...custom.map(c => ({ value: c.name, label: c.name, isCustom: true })),
  ];

  async function addCategory(name: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      setCustom(prev => [...prev, data]);
      return { ok: true };
    }
    return { ok: false, error: data.error };
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    setCustom(prev => prev.filter(c => c.id !== id));
  }

  return { options, custom, loading, addCategory, deleteCategory, refetch: fetch_ };
}
