import {
  Utensils, Car, Home, Plug, PiggyBank, TrendingUp, Clapperboard,
  HeartPulse, GraduationCap, ShoppingBag, MoreHorizontal, Circle,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  plug: Plug,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  clapperboard: Clapperboard,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'shopping-bag': ShoppingBag,
  'more-horizontal': MoreHorizontal,
  circle: Circle,
};

export function getCategoryIcon(icon?: string): LucideIcon {
  return (icon && ICON_MAP[icon]) || Circle;
}

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
