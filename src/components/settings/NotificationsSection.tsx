'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Toggle from '@/components/ui/Toggle';
import SettingsSection from '@/components/settings/SettingsSection';

interface NotificationsSectionProps {
  budgetWarnings: boolean;
  monthlyReports: boolean;
  spendingAlerts: boolean;
}

export default function NotificationsSection(initial: NotificationsSectionProps) {
  const [prefs, setPrefs] = useState(initial);

  const update = async (key: keyof NotificationsSectionProps, value: boolean) => {
    const previous = prefs;
    setPrefs((p) => ({ ...p, [key]: value }));

    const res = await fetch('/api/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications: { ...previous, [key]: value } }),
    });

    if (!res.ok) {
      setPrefs(previous);
      toast.error('Could not update this setting.');
    }
  };

  return (
    <SettingsSection title="Notifications" description="Choose what you want to be alerted about.">
      <div className="divide-y divide-border">
        <Toggle
          checked={prefs.budgetWarnings}
          onChange={(v) => update('budgetWarnings', v)}
          label="Budget warnings"
          description="Alert me when I'm approaching my monthly budget limit."
        />
        <Toggle
          checked={prefs.monthlyReports}
          onChange={(v) => update('monthlyReports', v)}
          label="Monthly report generation"
          description="Generate a report automatically once each month completes."
        />
        <Toggle
          checked={prefs.spendingAlerts}
          onChange={(v) => update('spendingAlerts', v)}
          label="Spending alerts"
          description="Alert me about unusual spending activity."
        />
      </div>
    </SettingsSection>
  );
}
