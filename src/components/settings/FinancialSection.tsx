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
  monthlyIncome?: number;
  housingExpense?: number;
  foodExpense?: number;
  transportExpense?: number;
  utilitiesExpense?: number;
  debtPayment?: number;
  currentSavings?: number;
  emergencyFund?: number;
  dependents?: number;
  incomeStability?: 'stable' | 'variable' | 'unstable';
  financialGoal?: string;
  savingsGoal?: string;
  onSaved: (user: any) => void;
}

export default function FinancialSection({
  averageMonthlyBudget,
  currency,
  monthlyIncome = 0,
  housingExpense = 0,
  foodExpense = 0,
  transportExpense = 0,
  utilitiesExpense = 0,
  debtPayment = 0,
  currentSavings = 0,
  emergencyFund = 0,
  dependents = 0,
  incomeStability = 'stable',
  financialGoal = '',
  savingsGoal = '',
  onSaved,
}: FinancialSectionProps) {
  const [form, setForm] = useState({
    averageMonthlyBudget,
    currency,
    monthlyIncome,
    housingExpense,
    foodExpense,
    transportExpense,
    utilitiesExpense,
    debtPayment,
    currentSavings,
    emergencyFund,
    dependents,
    incomeStability,
    financialGoal,
    savingsGoal,
  });
  const [isSaving, setIsSaving] = useState(false);

  const num = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: Number(e.target.value) }));

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
      toast.success(
        result.strategyUpdated
          ? 'Financial profile updated — your AI budget recommendation was refreshed.'
          : 'Financial profile updated.'
      );
      onSaved(result.user);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSection
      title="Financial Profile"
      description="Your baseline budget and the details the AI budgeting engine uses to personalize your Needs/Wants/Savings split."
    >
      <div className="space-y-4">
        <Input
          label="Average monthly budget"
          type="number"
          step="0.01"
          min="0"
          value={form.averageMonthlyBudget}
          onChange={num('averageMonthlyBudget')}
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

        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            AI budgeting profile
          </p>
          <div className="space-y-4">
            <Input label="Monthly income" type="number" step="0.01" min="0" value={form.monthlyIncome} onChange={num('monthlyIncome')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Housing / rent" type="number" step="0.01" min="0" value={form.housingExpense} onChange={num('housingExpense')} />
              <Input label="Food" type="number" step="0.01" min="0" value={form.foodExpense} onChange={num('foodExpense')} />
              <Input label="Transport" type="number" step="0.01" min="0" value={form.transportExpense} onChange={num('transportExpense')} />
              <Input label="Utilities" type="number" step="0.01" min="0" value={form.utilitiesExpense} onChange={num('utilitiesExpense')} />
              <Input label="Debt / loan payments" type="number" step="0.01" min="0" value={form.debtPayment} onChange={num('debtPayment')} />
              <Input label="Dependents" type="number" step="1" min="0" value={form.dependents} onChange={num('dependents')} />
              <Input label="Current savings" type="number" step="0.01" min="0" value={form.currentSavings} onChange={num('currentSavings')} />
              <Input label="Emergency fund" type="number" step="0.01" min="0" value={form.emergencyFund} onChange={num('emergencyFund')} />
            </div>
            <Select
              label="How stable is your income?"
              value={form.incomeStability}
              onChange={(e) => setForm((f) => ({ ...f, incomeStability: e.target.value as any }))}
            >
              <option value="stable">Stable — regular, predictable income</option>
              <option value="variable">Variable — fluctuates month to month</option>
              <option value="unstable">Unstable — irregular or unreliable</option>
            </Select>
            <Input
              label="Financial goal (optional)"
              value={form.financialGoal}
              onChange={(e) => setForm((f) => ({ ...f, financialGoal: e.target.value }))}
            />
            <Input
              label="Savings / investment goal (optional)"
              value={form.savingsGoal}
              onChange={(e) => setForm((f) => ({ ...f, savingsGoal: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save changes
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
