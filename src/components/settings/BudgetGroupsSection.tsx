'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import SettingsSection from '@/components/settings/SettingsSection';
import {
  BUDGET_GROUP_KEYS,
  BUDGET_GROUP_LABELS,
  BUDGET_GROUP_TARGET_PERCENT,
  effectiveBudgetGroup,
  type BudgetGroupKey,
} from '@/lib/budget-groups';
import type { CategoryType } from '@/types';

interface CategoryItem {
  _id: string;
  name: string;
  type: CategoryType;
  budgetGroup?: BudgetGroupKey | null;
}

export default function BudgetGroupsSection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addSelections, setAddSelections] = useState<Record<BudgetGroupKey, string>>({
    needs: '',
    wants: '',
    savings: '',
  });

  const load = useCallback(async () => {
    const res = await fetch('/api/categories');
    const result = await res.json();
    if (res.ok) setCategories(result.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byGroup = useMemo(() => {
    const groups: Record<BudgetGroupKey | 'unassigned', CategoryItem[]> = {
      needs: [],
      wants: [],
      savings: [],
      unassigned: [],
    };
    for (const category of categories) {
      const group = effectiveBudgetGroup(category);
      groups[group ?? 'unassigned'].push(category);
    }
    return groups;
  }, [categories]);

  const assignToGroup = async (categoryId: string, budgetGroup: BudgetGroupKey | null) => {
    setPendingId(categoryId);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetGroup }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not update this category.');
        return;
      }
      await load();
    } finally {
      setPendingId(null);
    }
  };

  if (loading) return <div className="h-64 rounded-2xl bg-muted animate-pulse" />;

  return (
    <SettingsSection
      title="Budget Ratio (50/30/20)"
      description="Choose which categories count toward your Needs, Wants, and Savings & Financial Goals targets."
    >
      <div className="space-y-5">
        {BUDGET_GROUP_KEYS.map((groupKey) => {
          const groupCategories = byGroup[groupKey];
          const availableToAdd = categories.filter(
            (c) => effectiveBudgetGroup(c) !== groupKey
          );

          return (
            <div key={groupKey} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {BUDGET_GROUP_LABELS[groupKey]}
                </h3>
                <span className="text-xs font-medium text-muted-foreground">
                  Target {BUDGET_GROUP_TARGET_PERCENT[groupKey]}%
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {groupCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">No categories assigned yet.</p>
                )}
                {groupCategories.map((category) => (
                  <span
                    key={category._id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {category.name}
                    <button
                      type="button"
                      onClick={() => assignToGroup(category._id, null)}
                      disabled={pendingId === category._id}
                      aria-label={`Remove ${category.name} from ${BUDGET_GROUP_LABELS[groupKey]}`}
                      className="rounded-full text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {availableToAdd.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Select
                    aria-label={`Add a category to ${BUDGET_GROUP_LABELS[groupKey]}`}
                    className="h-9 text-xs"
                    value={addSelections[groupKey]}
                    onChange={(e) =>
                      setAddSelections((s) => ({ ...s, [groupKey]: e.target.value }))
                    }
                  >
                    <option value="">Add a category…</option>
                    {availableToAdd.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!addSelections[groupKey] || pendingId === addSelections[groupKey]}
                    onClick={() => {
                      const id = addSelections[groupKey];
                      if (!id) return;
                      assignToGroup(id, groupKey);
                      setAddSelections((s) => ({ ...s, [groupKey]: '' }));
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {byGroup.unassigned.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Not counted toward any target
            </p>
            <div className="flex flex-wrap gap-2">
              {byGroup.unassigned.map((category) => (
                <span
                  key={category._id}
                  className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}