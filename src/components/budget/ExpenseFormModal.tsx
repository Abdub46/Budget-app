'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from 'date-fns';
import Modal from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Select a category'),
  destination: z.string().trim().max(120).optional(),
  description: z.string().trim().max(240).optional(),
  paymentMethod: z.enum(['cash', 'card', 'mobile-money', 'bank-transfer', 'other']),
  date: z.string().min(1, 'Select a date'),
  notes: z.string().trim().max(500).optional(),
});
type FormInput = z.infer<typeof formSchema>;

export interface CategoryOption {
  _id: string;
  name: string;
  type: string;
  icon: string;
}

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  onSaved: () => void;
  expense?: {
    _id: string;
    amount: number;
    categoryId: string | { _id: string };
    destination?: string;
    description?: string;
    paymentMethod: string;
    date: string;
    notes?: string;
  } | null;
}

export default function ExpenseFormModal({
  open,
  onClose,
  categories,
  onSaved,
  expense,
}: ExpenseFormModalProps) {
  const isEditing = !!expense;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { paymentMethod: 'cash', date: format(new Date(), 'yyyy-MM-dd') },
  });

  useEffect(() => {
    if (open) {
      if (expense) {
        const categoryId =
          typeof expense.categoryId === 'string' ? expense.categoryId : expense.categoryId._id;
        reset({
          amount: expense.amount,
          categoryId,
          destination: expense.destination ?? '',
          description: expense.description ?? '',
          paymentMethod: expense.paymentMethod as FormInput['paymentMethod'],
          date: format(new Date(expense.date), 'yyyy-MM-dd'),
          notes: expense.notes ?? '',
        });
      } else {
        reset({
          amount: undefined,
          categoryId: categories[0]?._id ?? '',
          destination: '',
          description: '',
          paymentMethod: 'cash',
          date: format(new Date(), 'yyyy-MM-dd'),
          notes: '',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense]);

  const onSubmit = async (data: FormInput) => {
    const url = isEditing ? `/api/expenses/${expense!._id}` : '/api/expenses';
    const method = isEditing ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error || 'Could not save expense.');
      return;
    }

    toast.success(isEditing ? 'Expense updated.' : 'Expense recorded.');
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit expense' : 'Record an expense'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          autoFocus
          placeholder="e.g. 1500"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <Select label="Category" error={errors.categoryId?.message} {...register('categoryId')}>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
          <Select
            label="Payment method"
            error={errors.paymentMethod?.message}
            {...register('paymentMethod')}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile-money">Mobile Money</option>
            <option value="bank-transfer">Bank Transfer</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <Input
          label="Destination (optional)"
          placeholder="e.g. Naivas Supermarket"
          error={errors.destination?.message}
          {...register('destination')}
        />
        <Input
          label="Description (optional)"
          placeholder="e.g. Weekly groceries"
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
