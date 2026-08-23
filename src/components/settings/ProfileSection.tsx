'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import SettingsSection from '@/components/settings/SettingsSection';
import type { EmploymentStatus } from '@/types';

interface ProfileSectionProps {
  employmentStatus: EmploymentStatus;
  employmentPlace?: string;
  position?: string;
  businessName?: string;
  occupation?: string;
  institution?: string;
  course?: string;
  onSaved: (user: any) => void;
}

const fieldTransition = { duration: 0.2 };

export default function ProfileSection(props: ProfileSectionProps) {
  const [status, setStatus] = useState<EmploymentStatus>(props.employmentStatus);
  const [form, setForm] = useState({
    employmentPlace: props.employmentPlace ?? '',
    position: props.position ?? '',
    businessName: props.businessName ?? '',
    occupation: props.occupation ?? '',
    institution: props.institution ?? '',
    course: props.course ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employmentStatus: status, ...form }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not update profile.');
        return;
      }
      toast.success('Profile updated.');
      props.onSaved(result.user);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSection
      title="Personal Profile"
      description="Helps personalize your budgeting insights. Never shown publicly."
    >
      <div className="space-y-4">
        <Select
          label="What best describes your current status?"
          value={status}
          onChange={(e) => setStatus(e.target.value as EmploymentStatus)}
        >
          <option value="employed">Employed</option>
          <option value="self-employed">Self-employed</option>
          <option value="student">Student</option>
        </Select>

        <AnimatePresence mode="wait">
          {status === 'employed' && (
            <motion.div
              key="employed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={fieldTransition}
              className="space-y-4 overflow-hidden"
            >
              <Input
                label="Place of employment"
                value={form.employmentPlace}
                onChange={(e) => setForm((f) => ({ ...f, employmentPlace: e.target.value }))}
              />
              <Input
                label="Position"
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              />
            </motion.div>
          )}

          {status === 'self-employed' && (
            <motion.div
              key="self-employed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={fieldTransition}
              className="space-y-4 overflow-hidden"
            >
              <Input
                label="Business / work name (optional)"
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              />
              <Input
                label="Occupation / type of work (optional)"
                value={form.occupation}
                onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
              />
            </motion.div>
          )}

          {status === 'student' && (
            <motion.div
              key="student"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={fieldTransition}
              className="space-y-4 overflow-hidden"
            >
              <Input
                label="Institution (optional)"
                value={form.institution}
                onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
              />
              <Input
                label="Course / field of study (optional)"
                value={form.course}
                onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save changes
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
