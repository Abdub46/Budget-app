import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Wallet className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link href="/dashboard">
          <Button className="mt-5">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
