import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Branding panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-600 to-primary-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white blur-3xl" />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Wallet className="h-5 w-5" />
          </span>
          Budget
        </Link>

        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            Understand your money at a glance.
          </h1>
          <p className="text-primary-100 text-base leading-relaxed">
            Track budgets, watch spending patterns, and get AI-powered insights
            personalized to your financial life — all in one premium dashboard.
          </p>
        </div>

        <p className="relative z-10 text-xs text-primary-200">
          © {new Date().getFullYear()} Budget. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
