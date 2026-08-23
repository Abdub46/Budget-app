'use client';

import { Wallet } from 'lucide-react';

export default function MobileTopBar() {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 h-14 px-4 border-b border-border bg-card/90 backdrop-blur-lg">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Wallet className="h-4 w-4" />
      </span>
      <span className="font-semibold text-foreground">Budget</span>
    </header>
  );
}
