'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ThumbsUp, AlertTriangle, AlertOctagon } from 'lucide-react';

export interface BudgetHealth {
  status: 'excellent' | 'good' | 'attention' | 'critical';
  label: string;
  explanation: string;
}

const STATUS_STYLES: Record<
  BudgetHealth['status'],
  { icon: typeof CheckCircle2; wrap: string; badge: string }
> = {
  excellent: {
    icon: CheckCircle2,
    wrap: 'border-success/30 bg-success-light dark:bg-success/10',
    badge: 'bg-success text-white',
  },
  good: {
    icon: ThumbsUp,
    wrap: 'border-primary/30 bg-primary-50 dark:bg-primary/10',
    badge: 'bg-primary text-white',
  },
  attention: {
    icon: AlertTriangle,
    wrap: 'border-warning/30 bg-warning-light dark:bg-warning/10',
    badge: 'bg-warning text-white',
  },
  critical: {
    icon: AlertOctagon,
    wrap: 'border-danger/30 bg-danger-light dark:bg-danger/10',
    badge: 'bg-danger text-white',
  },
};

export default function BudgetHealthCard({ health }: { health: BudgetHealth }) {
  const { icon: Icon, wrap, badge } = STATUS_STYLES[health.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className={`rounded-2xl border p-5 ${wrap}`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${badge}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Budget Health
          </p>
          <p className="mt-0.5 text-base font-semibold text-foreground">{health.label}</p>
          <p className="mt-1 text-sm text-foreground/80 leading-relaxed">{health.explanation}</p>
        </div>
      </div>
    </motion.div>
  );
}
