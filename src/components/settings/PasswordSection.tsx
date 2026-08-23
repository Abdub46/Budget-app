'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import SettingsSection from '@/components/settings/SettingsSection';
import { passwordChangeSchema, type PasswordChangeInput } from '@/lib/validations';

export default function PasswordSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeInput>({ resolver: zodResolver(passwordChangeSchema) });
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (data: PasswordChangeInput) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not update password.');
        return;
      }
      toast.success('Password updated.');
      reset();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSection title="Password" description="Change your account password.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Current password"
          type="password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Input
          label="New password"
          type="password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label="Confirm new password"
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" isLoading={isSaving}>
            Update password
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
