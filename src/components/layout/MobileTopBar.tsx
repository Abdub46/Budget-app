'use client';

import { Wallet } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAvatar } from '@/components/providers/AvatarProvider';

export default function MobileTopBar({ userName }: { userName?: string | null }) {
  const { avatarUrl } = useAvatar();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 h-14 px-4 border-b border-border bg-card/90 backdrop-blur-lg">
      <Avatar
        src={avatarUrl}
        name={userName}
        size={28}
        className="rounded-md"
        showInitials={false}
        fallbackIcon={<Wallet className="h-4 w-4" />}
      />
      <span className="font-semibold text-foreground">Budget</span>
    </header>
  );
}
