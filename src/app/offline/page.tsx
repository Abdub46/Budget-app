import { WifiOff } from 'lucide-react';
import RetryButton from '@/components/offline/RetryButton';

export const metadata = {
  title: 'You\u2019re offline',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <WifiOff className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold text-foreground">You&apos;re offline</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This page needs an internet connection. Your budgets and expenses are
          never cached on this device, so reconnect and try again to see
          up-to-date data.
        </p>
        <RetryButton />
      </div>
    </div>
  );
}