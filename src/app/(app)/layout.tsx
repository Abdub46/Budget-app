import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AppShell from '@/components/layout/AppShell';

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Middleware already protects these routes; this is defense-in-depth in
  // case the layout is ever reached without middleware running (e.g. tests).
  if (!session) redirect('/login');

  return <AppShell userName={session.user?.name}>{children}</AppShell>;
}
