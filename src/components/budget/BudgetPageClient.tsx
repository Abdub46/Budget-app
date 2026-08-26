'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import MonthYearSelector from '@/components/budget/MonthYearSelector';
import BudgetSummaryCard from '@/components/budget/BudgetSummaryCard';
import CreateBudgetModal from '@/components/budget/CreateBudgetModal';
import AddFundsModal from '@/components/budget/AddFundsModal';
import ExpenseFormModal, { type CategoryOption } from '@/components/budget/ExpenseFormModal';
import ExpenseList, { type ExpenseItem } from '@/components/budget/ExpenseList';
import CategoryManager from '@/components/budget/CategoryManager';
import BudgetStrategyCard, { type BudgetStrategy } from '@/components/dashboard/BudgetStrategyCard';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';

interface BudgetData {
  _id: string;
  initialAmount: number;
  totalAdditionalAmount: number;
  totalBudget: number;
  remaining: number;
  utilizationPercent: number;
  comparison: { status: 'above' | 'below' | 'equal'; absDiff: number; percent: number };
}

export default function BudgetPageClient() {
  const { data: session } = useSession();
  const currency = session?.user?.currency ?? 'KES';

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [budgetLoading, setBudgetLoading] = useState(true);

  const [strategy, setStrategy] = useState<BudgetStrategy | null>(null);

  const [categories, setCategories] = useState<(CategoryOption & { isDefault: boolean })[]>([]);

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expensePage, setExpensePage] = useState(1);
  const [expenseTotalPages, setExpenseTotalPages] = useState(1);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const loadBudget = useCallback(async () => {
    setBudgetLoading(true);
    try {
      // Find this month's budget from the list endpoint (simplest ownership-safe way
      // to check existence without knowing its ID up front).
      const res = await fetch(`/api/budgets?year=${year}&limit=12`);
      const result = await res.json();
      const match = result.items?.find((b: any) => b.month === month);

      if (!match) {
        setBudget(null);
        setTotalExpenses(0);
        return;
      }

      const detailRes = await fetch(`/api/budgets/${match._id}`);
      const detail = await detailRes.json();
      if (detailRes.ok) {
        setBudget(detail.budget);
        setTotalExpenses(detail.totalExpenses);
      }
    } catch {
      toast.error('Could not load this month\u2019s budget.');
    } finally {
      setBudgetLoading(false);
    }
  }, [month, year]);

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/categories');
    const result = await res.json();
    if (res.ok) setCategories(result.categories);
  }, []);

  const loadExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
        page: String(expensePage),
        limit: '10',
      });
      if (categoryFilter) params.set('categoryType', categoryFilter);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const result = await res.json();
      if (res.ok) {
        setExpenses(result.items);
        setExpenseTotalPages(result.pagination.totalPages);
      }
    } finally {
      setExpensesLoading(false);
    }
  }, [month, year, expensePage, categoryFilter]);

  const loadStrategy = useCallback(async () => {
    const res = await fetch('/api/budget-strategy');
    const result = await res.json();
    if (res.ok) setStrategy(result.strategy);
  }, []);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  useEffect(() => {
    loadStrategy();
  }, [loadStrategy]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setExpensePage(1);
  }, [month, year, categoryFilter]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const result = await res.json();
      toast.error(result.error || 'Could not delete expense.');
      return;
    }
    toast.success('Expense deleted.');
    loadExpenses();
    loadBudget();
  };

  const handleExpenseSaved = () => {
    loadExpenses();
    loadBudget();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Budget</h1>
          <p className="text-sm text-muted-foreground">
            Manage this month&apos;s budget and track every expense.
          </p>
        </div>
        <MonthYearSelector month={month} year={year} onChange={handleMonthChange} />
      </div>

      {!budgetLoading && (
        <BudgetSummaryCard
          month={month}
          year={year}
          currency={currency}
          budget={budget}
          totalExpenses={totalExpenses}
          onCreateBudget={() => setCreateOpen(true)}
          onAddFunds={() => setAddFundsOpen(true)}
        />
      )}

      {strategy && <BudgetStrategyCard strategy={strategy} onUpdated={setStrategy} />}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Expenses</h2>
            <div className="flex items-center gap-2">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 w-40"
              >
                <option value="">All categories</option>
                {Array.from(new Set(categories.map((c) => c.type))).map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseModalOpen(true);
                }}
                disabled={!budget}
                title={!budget ? 'Create a budget for this month first' : undefined}
              >
                <Plus className="h-3.5 w-3.5" />
                Add expense
              </Button>
            </div>
          </div>

          <ExpenseList
            expenses={expenses}
            currency={currency}
            page={expensePage}
            totalPages={expenseTotalPages}
            onPageChange={setExpensePage}
            onEdit={(expense) => {
              setEditingExpense(expense);
              setExpenseModalOpen(true);
            }}
            onDelete={handleDeleteExpense}
            isLoading={expensesLoading}
          />
        </div>

        <div>
          <CategoryManager categories={categories} onChanged={loadCategories} />
        </div>
      </div>

      <CreateBudgetModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        month={month}
        year={year}
        onCreated={loadBudget}
      />

      {budget && (
        <AddFundsModal
          open={addFundsOpen}
          onClose={() => setAddFundsOpen(false)}
          budgetId={budget._id}
          onAdded={loadBudget}
        />
      )}

      <ExpenseFormModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        categories={categories}
        expense={editingExpense as any}
        onSaved={handleExpenseSaved}
      />
    </div>
  );
}
