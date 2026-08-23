import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import MobileTopBar from '@/components/layout/MobileTopBar';
import PageTransition from '@/components/layout/PageTransition';

export default function AppShell({
  userName,
  children,
}: {
  userName?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userName={userName} />
      <div className="flex-1 min-w-0">
        <MobileTopBar />
        <main className="pb-20 lg:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
