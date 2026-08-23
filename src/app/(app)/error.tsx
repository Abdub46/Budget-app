'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          An unexpected error occurred while loading this page. Your data is safe.
        </p>
        <Button className="mt-5" onClick={reset}>
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    </div>
  );
}
