'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Pencil, Trash2, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/icon-map';
import { Button } from '@/components/ui/Button';

export interface ExpenseItem {
  _id: string;
  amount: number;
  categoryId: { _id: string; name: string; icon: string; type: string } | string;
  destination?: string;
  description?: string;
  paymentMethod: string;
  date: string;
}

interface ExpenseListProps {
  expenses: ExpenseItem[];
  currency: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (expense: ExpenseItem) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export default function ExpenseList({
  expenses,
  currency,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  isLoading,
}: ExpenseListProps) {
  if (!isLoading && expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No expenses recorded for this period yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <ul className="divide-y divide-border">
        <AnimatePresence initial={false}>
          {expenses.map((expense) => {
            const category =
              typeof expense.categoryId === 'object' ? expense.categoryId : null;
            const Icon = getCategoryIcon(category?.icon);
            return (
              <motion.li
                key={expense._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {expense.destination || expense.description || category?.name || 'Expense'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {category?.name ?? 'Uncategorized'} &middot; {format(new Date(expense.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-foreground">
                  {formatCurrency(expense.amount, currency)}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onEdit(expense)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Edit expense"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(expense._id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
