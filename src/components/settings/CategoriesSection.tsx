'use client';

import { useCallback, useEffect, useState } from 'react';
import CategoryManager from '@/components/budget/CategoryManager';
import type { CategoryOption } from '@/components/budget/ExpenseFormModal';

// NOTE: CategoryManager already renders its own titled card (reused as-is
// from the Budget page), so this section intentionally skips the
// SettingsSection wrapper other sections use, to avoid a double-boxed card.
export default function CategoriesSection() {
  const [categories, setCategories] = useState<(CategoryOption & { isDefault: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/categories');
    const result = await res.json();
    if (res.ok) setCategories(result.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="h-32 rounded-2xl bg-muted animate-pulse" />;

  return <CategoryManager categories={categories} onChanged={load} />;
}
