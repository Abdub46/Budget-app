import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import AppShell from '@/components/layout/AppShell';

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Middleware already protects these routes; this is defense-in-depth in
  // case the layout is ever reached without middleware running (e.g. tests).
  if (!session) redirect('/login');

  // Fetched here (once per layout mount, not per navigation within the app
  // group) so the sidebar/top bar render with the correct photo on first
  // paint instead of flashing the fallback icon in — the avatar itself
  // isn't in the JWT/session since a base64 image would bloat the cookie.
  await connectDB();
  const user = await User.findById(session.user.id).select('avatar').lean();

  return (
    <AppShell userName={session.user?.name} initialAvatar={user?.avatar ?? null}>
      {children}
    </AppShell>
  );
}
