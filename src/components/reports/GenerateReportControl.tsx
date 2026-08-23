'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { MONTH_NAMES } from '@/lib/utils';

export default function GenerateReportControl({ onGenerated }: { onGenerated: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Could not generate report.');
        return;
      }

      toast.success(
        result.emailSent
          ? `${result.report.filename} generated and emailed.`
          : `${result.report.filename} generated.`
      );
      onGenerated();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="h-9 w-36">
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </Select>
      <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-9 w-24">
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
      <Button size="sm" onClick={handleGenerate} isLoading={isGenerating}>
        {!isGenerating && <FileDown className="h-3.5 w-3.5" />}
        Generate report
      </Button>
    </div>
  );
}
