'use client';

import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  accessibleSummary?: string;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({ title, accessibleSummary, children, className }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border border-border bg-card p-5 ${className ?? ''}`}
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {accessibleSummary && <p className="sr-only">{accessibleSummary}</p>}
      {children}
    </motion.div>
  );
}
