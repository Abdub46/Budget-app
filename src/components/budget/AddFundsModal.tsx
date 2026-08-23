'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: z.string().trim().max(240).optional(),
});
type FormInput = z.infer<typeof formSchema>;

interface AddFundsModalProps {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  onAdded: () => void;
}

export default function AddFundsModal({ open, onClose, budgetId, onAdded }: AddFundsModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (data: FormInput) => {
    const res = await fetch(`/api/budgets/${budgetId}/additions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error || 'Could not add funds.');
      return;
    }

    toast.success('Funds added to this month\u2019s budget.');
    reset();
    onAdded();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add funds to this month"
      description="Your original budget amount stays on record — this is tracked separately as an addition."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Amount to add"
          type="number"
          step="0.01"
          min="0"
          autoFocus
          placeholder="e.g. 10000"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <Input
          label="Description (optional)"
          placeholder="e.g. Bonus payment"
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add funds
          </Button>
        </div>
      </form>
    </Modal>
  );
}
