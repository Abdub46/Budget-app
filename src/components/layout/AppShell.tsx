import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import MobileTopBar from '@/components/layout/MobileTopBar';
import PageTransition from '@/components/layout/PageTransition';
import { AvatarProvider } from '@/components/providers/AvatarProvider';

export default function AppShell({
  userName,
  initialAvatar,
  children,
}: {
  userName?: string | null;
  initialAvatar: string | null;
  children: React.ReactNode;
}) {
  return (
    <AvatarProvider initialAvatar={initialAvatar}>
      <div className="flex min-h-screen bg-background">
        <Sidebar userName={userName} />
        <div className="flex-1 min-w-0">
          <MobileTopBar userName={userName} />
          <main className="pb-20 lg:pb-0">
            <PageTransition>{children}</PageTransition>
          </main>
          <MobileNav />
        </div>
      </div>
    </AvatarProvider>
  );
}
