'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, SlidersHorizontal, RotateCcw, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import CustomizeBudgetModal from '@/components/dashboard/CustomizeBudgetModal';

export interface BudgetStrategy {
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  source: 'ai' | 'custom';
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  primaryDriver?: string;
  changeReason?: string;
  generatedAt: string;
  nextReviewAt: string;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-success-light text-success-dark',
  medium: 'bg-warning-light text-warning-dark',
  low: 'bg-muted text-muted-foreground',
};

const SEGMENTS: Array<{ key: 'needsPercent' | 'wantsPercent' | 'savingsPercent'; label: string; color: string }> = [
  { key: 'needsPercent', label: 'Needs', color: 'bg-primary' },
  { key: 'wantsPercent', label: 'Wants', color: 'bg-warning' },
  { key: 'savingsPercent', label: 'Savings & Investments', color: 'bg-success' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function BudgetStrategyCard({
  strategy,
  onUpdated,
  readOnly = false,
}: {
  strategy: BudgetStrategy;
  onUpdated: (strategy: BudgetStrategy) => void;
  /** Dashboard shows this card as an at-a-glance summary only — customizing
   * or reverting the allocation is done from the Budget page instead. */
  readOnly?: boolean;
}) {
  const [showCustomize, setShowCustomize] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const revertToAi = async () => {
    setIsReverting(true);
    try {
      const res = await fetch('/api/budget-strategy/override', { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not revert to the AI recommendation.');
        return;
      }
      toast.success('Reverted to the AI-recommended budget.');
      onUpdated(result.strategy);
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Budget Strategy
          </p>
          <div className="mt-1 flex items-center gap-2">
            {strategy.source === 'ai' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                <Sparkles className="h-3 w-3" />
                AI Recommended
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                <SlidersHorizontal className="h-3 w-3" />
                Custom Budget
              </span>
            )}
            {strategy.source === 'ai' && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CONFIDENCE_STYLES[strategy.confidence]}`}
              >
                Confidence: {strategy.confidence[0].toUpperCase() + strategy.confidence.slice(1)}
              </span>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowCustomize(true)}>
              Customize Budget
            </Button>
            {strategy.source === 'custom' && (
              <Button size="sm" variant="ghost" onClick={revertToAi} isLoading={isReverting}>
                <RotateCcw className="h-3.5 w-3.5" />
                Use AI recommendation
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Allocation bar */}
      <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {SEGMENTS.map((seg) => (
          <div
            key={seg.key}
            className={seg.color}
            style={{ width: `${strategy[seg.key]}%` }}
            title={`${seg.label}: ${strategy[seg.key]}%`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
        {SEGMENTS.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${seg.color}`} />
            {seg.label} <span className="font-medium text-foreground">{strategy[seg.key]}%</span>
          </span>
        ))}
      </div>

      {strategy.changeReason && (
        <div className="mt-4 rounded-lg bg-primary-50 px-3.5 py-2.5 text-xs text-primary-700">
          <span className="font-medium">Your budget strategy has been updated. </span>
          {strategy.changeReason}
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Why this recommendation?
        </p>
        <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">{strategy.reasoning}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Generated {formatDate(strategy.generatedAt)}</span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Next review: {formatDate(strategy.nextReviewAt)}
        </span>
      </div>

      {readOnly && (
        <p className="mt-3 text-xs text-muted-foreground">
          Manage this from the <span className="font-medium text-foreground">Budget</span> page.
        </p>
      )}

      {!readOnly && showCustomize && (
        <CustomizeBudgetModal
          initial={strategy}
          onClose={() => setShowCustomize(false)}
          onSaved={(updated) => {
            onUpdated(updated);
            setShowCustomize(false);
          }}
        />
      )}
    </motion.div>
  );
}
