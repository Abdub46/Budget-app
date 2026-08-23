'use client';

import { Button } from '@/components/ui/Button';

export default function RetryButton() {
  return (
    <Button className="mt-5" onClick={() => window.location.reload()}>
      Try again
    </Button>
  );
}