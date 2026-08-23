'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import SettingsSection from '@/components/settings/SettingsSection';

interface AccountSectionProps {
  name: string;
  email: string;
  phone: string;
  onSaved: (user: any) => void;
}

export default function AccountSection({ name, email, phone, onSaved }: AccountSectionProps) {
  const [form, setForm] = useState({ name, email, phone });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not update account.');
        return;
      }
      toast.success('Account updated.');
      onSaved(result.user);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSection title="Account" description="Your basic account information.">
      <div className="space-y-4">
        <Input
          label="Full name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Input
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save changes
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
