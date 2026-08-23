'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import SettingsSection from '@/components/settings/SettingsSection';
import { useAvatar } from '@/components/providers/AvatarProvider';
import { resizeImageToDataUrl } from '@/lib/image-resize';

const MAX_SOURCE_FILE_BYTES = 8 * 1024 * 1024; // 8MB — generous, since it's downscaled before upload

export default function AvatarSection({ name }: { name: string }) {
  const { avatarUrl, setAvatarUrl } = useAvatar();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      toast.error('That image is too large. Please choose one under 8MB.');
      return;
    }

    setIsSaving(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      await saveAvatar(dataUrl);
    } catch (err: any) {
      toast.error(err?.message || 'Could not process that image.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      await saveAvatar(null);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAvatar = async (avatar: string | null) => {
    const res = await fetch('/api/settings/avatar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar }),
    });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error || 'Could not update your photo.');
      return;
    }
    setAvatarUrl(avatar);
    toast.success(avatar ? 'Profile photo updated.' : 'Profile photo removed.');
  };

  return (
    <SettingsSection title="Profile photo" description="Shown in the sidebar and top bar.">
      <div className="flex items-center gap-4">
        <Avatar src={avatarUrl} name={name} size={64} />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isSaving}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            {avatarUrl ? 'Change photo' : 'Upload photo'}
          </Button>
          {avatarUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={isSaving}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </SettingsSection>
  );
}