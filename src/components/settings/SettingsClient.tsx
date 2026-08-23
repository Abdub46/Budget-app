'use client';

import { useEffect, useState } from 'react';
import AccountSection from '@/components/settings/AccountSection';
import AvatarSection from '@/components/settings/AvatarSection';
import PasswordSection from '@/components/settings/PasswordSection';
import ProfileSection from '@/components/settings/ProfileSection';
import FinancialSection from '@/components/settings/FinancialSection';
import CategoriesSection from '@/components/settings/CategoriesSection';
import MonthlyReportsSection from '@/components/settings/MonthlyReportsSection';
import NotificationsSection from '@/components/settings/NotificationsSection';
import AppearanceSection from '@/components/settings/AppearanceSection';

interface SettingsUser {
  name: string;
  email: string;
  phone: string;
  currency: string;
  averageMonthlyBudget: number;
  employmentStatus: 'employed' | 'self-employed' | 'student';
  employmentPlace?: string;
  position?: string;
  businessName?: string;
  occupation?: string;
  institution?: string;
  course?: string;
  settings: {
    emailReportsEnabled: boolean;
    notifications: { budgetWarnings: boolean; monthlyReports: boolean; spendingAlerts: boolean };
    appearance: 'light' | 'dark' | 'system';
  };
}

export default function SettingsClient() {
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account, financial profile, and preferences.
        </p>
      </div>

      <AvatarSection name={user.name} />

      <AccountSection
        name={user.name}
        email={user.email}
        phone={user.phone}
        onSaved={(updated) => setUser((u) => (u ? { ...u, ...updated } : u))}
      />

      <PasswordSection />

      <ProfileSection
        employmentStatus={user.employmentStatus}
        employmentPlace={user.employmentPlace}
        position={user.position}
        businessName={user.businessName}
        occupation={user.occupation}
        institution={user.institution}
        course={user.course}
        onSaved={(updated) => setUser((u) => (u ? { ...u, ...updated } : u))}
      />

      <FinancialSection
        averageMonthlyBudget={user.averageMonthlyBudget}
        currency={user.currency}
        onSaved={(updated) => setUser((u) => (u ? { ...u, ...updated } : u))}
      />

      <SectionWrapper title="Categories">
        <CategoriesSection />
      </SectionWrapper>

      <MonthlyReportsSection emailReportsEnabled={user.settings.emailReportsEnabled} />

      <NotificationsSection
        budgetWarnings={user.settings.notifications.budgetWarnings}
        monthlyReports={user.settings.notifications.monthlyReports}
        spendingAlerts={user.settings.notifications.spendingAlerts}
      />

      <AppearanceSection initial={user.settings.appearance} />
    </div>
  );
}

// Categories section title lives here (rather than inside CategoriesSection)
// since CategoryManager brings its own card chrome — this just gives it a
// consistent page heading to match the other sections.
function SectionWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
        {title}
      </h2>
      {children}
    </div>
  );
}
