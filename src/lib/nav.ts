import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Wallet, Sparkles, Settings } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Budget', href: '/budget', icon: Wallet },
  { label: 'AI Assistant', href: '/assistant', icon: Sparkles },
  { label: 'Settings', href: '/settings', icon: Settings },
];
