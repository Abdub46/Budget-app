'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import SettingsSection from '@/components/settings/SettingsSection';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export default function AppearanceSection({ initial }: { initial: 'light' | 'dark' | 'system' }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!theme) setTheme(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    const res = await fetch('/api/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appearance: value }),
    });
    if (!res.ok) toast.error('Could not save your appearance preference.');
  };

  return (
    <SettingsSection title="Appearance" description="Choose how Budget looks on this device.">
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = mounted && theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors',
                active
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}
