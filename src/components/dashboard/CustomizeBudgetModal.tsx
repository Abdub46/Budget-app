'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { BudgetStrategy } from '@/components/dashboard/BudgetStrategyCard';

export default function CustomizeBudgetModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: BudgetStrategy;
  onClose: () => void;
  onSaved: (strategy: BudgetStrategy) => void;
}) {
  const [needs, setNeeds] = useState(initial.needsPercent);
  const [wants, setWants] = useState(initial.wantsPercent);
  const [savings, setSavings] = useState(initial.savingsPercent);
  const [isSaving, setIsSaving] = useState(false);

  const total = needs + wants + savings;
  const isValid = total === 100;

  // Keeps the three sliders tied together: moving one adjusts the other two
  // proportionally so the total stays at (or very near) 100 without the
  // user having to do the math themselves.
  const handleChange = (which: 'needs' | 'wants' | 'savings', value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    if (which === 'needs') setNeeds(clamped);
    if (which === 'wants') setWants(clamped);
    if (which === 'savings') setSavings(clamped);
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error('Needs, Wants, and Savings must add up to 100%.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/budget-strategy/override', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsPercent: needs, wantsPercent: wants, savingsPercent: savings }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not save your custom allocation.');
        return;
      }
      toast.success('Custom budget saved.');
      onSaved(result.strategy);
    } finally {
      setIsSaving(false);
    }
  };

  const rows: Array<{ key: 'needs' | 'wants' | 'savings'; label: string; value: number; setter: (v: number) => void }> = [
    { key: 'needs', label: 'Needs', value: needs, setter: (v) => handleChange('needs', v) },
    { key: 'wants', label: 'Wants', value: wants, setter: (v) => handleChange('wants', v) },
    { key: 'savings', label: 'Savings & Investments', value: savings, setter: (v) => handleChange('savings', v) },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Customize Budget"
      description="Override the AI recommendation with your own Needs / Wants / Savings split. You can switch back to the AI recommendation at any time."
    >
      <div className="space-y-5">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{row.label}</label>
              <span className="text-sm tabular-nums text-muted-foreground">{row.value}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={row.value}
              onChange={(e) => row.setter(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </div>
        ))}

        <div
          className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium ${
            isValid ? 'bg-success-light text-success-dark' : 'bg-danger-light text-danger-dark'
          }`}
        >
          <span>Total</span>
          <span>{total}%</span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} isLoading={isSaving} disabled={!isValid}>
            Save custom budget
          </Button>
        </div>
      </div>
    </Modal>
  );
}
