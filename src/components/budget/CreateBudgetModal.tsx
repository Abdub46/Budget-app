'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { monthlyBudgetSchema } from '@/lib/validations';
import { z } from 'zod';
import { monthLabel } from '@/lib/utils';

const formSchema = monthlyBudgetSchema.pick({ initialAmount: true });
type FormInput = z.infer<typeof formSchema>;

interface CreateBudgetModalProps {
  open: boolean;
  onClose: () => void;
  month: number;
  year: number;
  onCreated: () => void;
}

export default function CreateBudgetModal({
  open,
  onClose,
  month,
  year,
  onCreated,
}: CreateBudgetModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (data: FormInput) => {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year, initialAmount: data.initialAmount }),
    });
    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error || 'Could not create budget.');
      return;
    }

    toast.success(`${monthLabel(month, year)} budget created.`);
    reset();
    onCreated();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Create ${monthLabel(month, year)} budget`}
      description="Set the initial amount you're planning to work with this month. You can add more later without losing this figure."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Initial budget amount"
          type="number"
          step="0.01"
          min="0"
          autoFocus
          placeholder="e.g. 50000"
          error={errors.initialAmount?.message}
          {...register('initialAmount')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create budget
          </Button>
        </div>
      </form>
    </Modal>
  );
}
