'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Toggle from '@/components/ui/Toggle';
import SettingsSection from '@/components/settings/SettingsSection';
import ReportHistory from '@/components/reports/ReportHistory';
import GenerateReportControl from '@/components/reports/GenerateReportControl';

export default function MonthlyReportsSection({
  emailReportsEnabled,
}: {
  emailReportsEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(emailReportsEnabled);
  const [reportsKey, setReportsKey] = useState(0);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    const res = await fetch('/api/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailReportsEnabled: value }),
    });
    if (!res.ok) {
      setEnabled(!value);
      toast.error('Could not update this setting.');
      return;
    }
    toast.success(value ? 'Monthly email reports enabled.' : 'Monthly email reports disabled.');
  };

  return (
    <SettingsSection
      title="Monthly Reports"
      description="A PDF budget summary is generated at month-end. Choose whether it's also emailed to you."
    >
      <Toggle
        checked={enabled}
        onChange={handleToggle}
        label="Email monthly budget summary"
        description="Sent automatically once each month closes."
      />

      <div className="mt-5 pt-5 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Report history
          </p>
          <GenerateReportControl onGenerated={() => setReportsKey((k) => k + 1)} />
        </div>
        <ReportHistory key={reportsKey} />
      </div>
    </SettingsSection>
  );
}
