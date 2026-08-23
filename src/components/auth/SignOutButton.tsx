'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SignOutButton() {
  return (
    <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
