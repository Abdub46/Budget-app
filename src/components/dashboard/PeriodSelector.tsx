'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Select, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { PeriodPreset } from '@/types';

const PRESET_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: 'current-month', label: 'Current Month' },
  { value: 'previous-month', label: 'Previous Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'last-12-months', label: 'Last 12 Months' },
  { value: 'all-months', label: 'All Months' },
  { value: 'custom', label: 'Custom Range' },
];

interface PeriodSelectorProps {
  preset: PeriodPreset;
  onChange: (preset: PeriodPreset, custom?: { from: string; to: string }) => void;
}

export default function PeriodSelector({ preset, onChange }: PeriodSelectorProps) {
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(preset === 'custom');

  const handlePresetChange = (value: PeriodPreset) => {
    if (value === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange(value);
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    onChange('custom', { from: customFrom, to: customTo });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 h-10">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select
          value={showCustom ? 'custom' : preset}
          onChange={(e) => handlePresetChange(e.target.value as PeriodPreset)}
          className="h-8 border-0 px-0 focus:ring-0"
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="h-10 w-40"
            aria-label="From month"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="month"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="h-10 w-40"
            aria-label="To month"
          />
          <Button size="sm" onClick={applyCustomRange}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
