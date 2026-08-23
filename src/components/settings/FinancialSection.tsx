'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import SettingsSection from '@/components/settings/SettingsSection';
import { CURRENCIES } from '@/types';

interface FinancialSectionProps {
  averageMonthlyBudget: number;
  currency: string;
  onSaved: (user: any) => void;
}

export default function FinancialSection({
  averageMonthlyBudget,
  currency,
  onSaved,
}: FinancialSectionProps) {
  const [form, setForm] = useState({ averageMonthlyBudget, currency });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/financial', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not update financial profile.');
        return;
      }
      toast.success('Financial profile updated.');
      onSaved(result.user);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSection
      title="Financial Profile"
      description="Your baseline budget — every month is compared against this."
    >
      <div className="space-y-4">
        <Input
          label="Average monthly budget"
          type="number"
          step="0.01"
          min="0"
          value={form.averageMonthlyBudget}
          onChange={(e) =>
            setForm((f) => ({ ...f, averageMonthlyBudget: Number(e.target.value) }))
          }
        />
        <Select
          label="Currency"
          value={form.currency}
          onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </Select>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save changes
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
