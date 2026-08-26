'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAvatar } from '@/components/providers/AvatarProvider';

export default function MobileTopBar({ userName }: { userName?: string | null }) {
  const { avatarUrl } = useAvatar();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 h-14 px-4 border-b border-border bg-card/90 backdrop-blur-lg">
      <Link href="/settings" aria-label="Go to settings" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar
          src={avatarUrl}
          name={userName}
          size={28}
          className="rounded-md"
          showInitials={false}
          fallbackIcon={<Wallet className="h-4 w-4" />}
        />
      </Link>
      <span className="font-semibold text-foreground">BUDGET</span>
    </header>
  );
}
