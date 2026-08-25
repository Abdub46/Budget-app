'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CURRENCIES } from '@/types';

const clientRegisterSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name is required').max(120),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z.string().trim().min(7, 'Enter a valid phone number').max(20),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
    country: z.string().trim().min(2, 'Country is required'),
    currency: z.string().trim().length(3),
    employmentStatus: z.enum(['employed', 'self-employed', 'student', 'other']),
    employmentPlace: z.string().trim().max(160).optional(),
    position: z.string().trim().max(120).optional(),
    businessName: z.string().trim().max(160).optional(),
    occupation: z.string().trim().max(120).optional(),
    institution: z.string().trim().max(160).optional(),
    course: z.string().trim().max(160).optional(),
    averageMonthlyBudget: z.coerce
      .number({ invalid_type_error: 'Enter your average monthly budget' })
      .min(0, 'Amount cannot be negative'),
    monthlyIncome: z.coerce.number().min(0).default(0),
    housingExpense: z.coerce.number().min(0).default(0),
    foodExpense: z.coerce.number().min(0).default(0),
    transportExpense: z.coerce.number().min(0).default(0),
    utilitiesExpense: z.coerce.number().min(0).default(0),
    debtPayment: z.coerce.number().min(0).default(0),
    currentSavings: z.coerce.number().min(0).default(0),
    emergencyFund: z.coerce.number().min(0).default(0),
    dependents: z.coerce.number().int().min(0).max(50).default(0),
    incomeStability: z.enum(['stable', 'variable', 'unstable']).default('stable'),
    financialGoal: z.string().trim().max(240).optional(),
    savingsGoal: z.string().trim().max(240).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: "Passwords don't match",
      });
    }
    if (data.employmentStatus === 'employed' && !data.employmentPlace?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['employmentPlace'],
        message: 'Place of employment is required',
      });
    }
  });

type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;

const fieldTransition = { duration: 0.2 };

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClientRegisterInput>({
    resolver: zodResolver(clientRegisterSchema),
    defaultValues: { currency: 'KES', employmentStatus: 'employed' },
  });

  const employmentStatus = watch('employmentStatus');

  const onSubmit = async (data: ClientRegisterInput) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...payload } = data;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Could not create your account.');
        return;
      }

      toast.success('Account created! Logging you in…');

      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.info('Account created — please log in.');
        router.push('/login');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Account information */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account information
        </p>
        <Input label="Full name" placeholder="Jane Wanjiru" error={errors.name?.message} {...register('name')} />
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Phone number"
          type="tel"
          placeholder="+254 7XX XXX XXX"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Country" placeholder="Kenya" error={errors.country?.message} {...register('country')} />
          <Select label="Currency" error={errors.currency?.message} {...register('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Employment / status */}
      <div className="space-y-4 border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Current status
        </p>
        <Select
          label="What best describes your current status?"
          error={errors.employmentStatus?.message}
          {...register('employmentStatus')}
        >
          <option value="employed">Employed</option>
          <option value="self-employed">Self-employed</option>
          <option value="student">Student</option>
          <option value="other">Other</option>
        </Select>

        <AnimatePresence mode="wait">
          {employmentStatus === 'employed' && (
            <motion.div
              key="employed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={fieldTransition}
              className="space-y-4 overflow-hidden"
            >
              <Input
                label="Place of employment"
                placeholder="e.g. Acme Ltd"
                error={errors.employmentPlace?.message}
                {...register('employmentPlace')}
              />
              <Input
                label="Position"
                placeholder="e.g. Software Developer"
                error={errors.position?.message}
                {...register('position')}
              />
            </motion.div>
          )}

          {employmentStatus === 'self-employed' && (
            <motion.div
              key="self-employed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={fieldTransition}
              className="space-y-4 overflow-hidden"
            >
              <Input
                label="Business / work name (optional)"
                placeholder="e.g. Jane's Bakery"
                error={errors.businessName?.message}
                {...register('businessName')}
              />
              <Input
                label="Occupation / type of work (optional)"
                placeholder="e.g. Graphic Designer"
                error={errors.occupation?.message}
                {...register('occupation')}
              />
            </motion.div>
          )}

          {employmentStatus === 'student' && (
            <motion.div
              key="student"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={fieldTransition}
              className="space-y-4 overflow-hidden"
            >
              <Input
                label="Institution (optional)"
                placeholder="e.g. University of Nairobi"
                error={errors.institution?.message}
                {...register('institution')}
              />
              <Input
                label="Course / field of study (optional)"
                placeholder="e.g. Computer Science"
                error={errors.course?.message}
                {...register('course')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Financial baseline */}
      <div className="space-y-4 border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Financial baseline
        </p>
        <Input
          label="What is your average monthly budget?"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 50000"
          hint="This is your baseline — each month's actual budget will be compared against it."
          error={errors.averageMonthlyBudget?.message}
          {...register('averageMonthlyBudget')}
        />
      </div>

      {/* AI budgeting profile — used to personalize the Needs/Wants/Savings
          allocation instead of forcing a fixed 50/30/20 split. Everything
          here is optional; the AI engine simply lowers its confidence
          level when a field is left at 0/blank rather than requiring it. */}
      <div className="space-y-4 border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          AI budgeting profile <span className="normal-case font-normal text-muted-foreground/70">(optional, but improves your recommendation)</span>
        </p>
        <Input
          label="Monthly income"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 80000"
          hint="If different from your average monthly budget above."
          error={errors.monthlyIncome?.message}
          {...register('monthlyIncome')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Housing / rent" type="number" step="0.01" min="0" placeholder="0" {...register('housingExpense')} />
          <Input label="Food" type="number" step="0.01" min="0" placeholder="0" {...register('foodExpense')} />
          <Input label="Transport" type="number" step="0.01" min="0" placeholder="0" {...register('transportExpense')} />
          <Input label="Utilities" type="number" step="0.01" min="0" placeholder="0" {...register('utilitiesExpense')} />
          <Input label="Debt / loan payments" type="number" step="0.01" min="0" placeholder="0" {...register('debtPayment')} />
          <Input label="Dependents" type="number" step="1" min="0" placeholder="0" {...register('dependents')} />
          <Input label="Current savings" type="number" step="0.01" min="0" placeholder="0" {...register('currentSavings')} />
          <Input label="Emergency fund" type="number" step="0.01" min="0" placeholder="0" {...register('emergencyFund')} />
        </div>
        <Select label="How stable is your income?" {...register('incomeStability')}>
          <option value="stable">Stable — regular, predictable income</option>
          <option value="variable">Variable — fluctuates month to month</option>
          <option value="unstable">Unstable — irregular or unreliable</option>
        </Select>
        <Input
          label="Financial goal (optional)"
          placeholder="e.g. Save for a house deposit"
          {...register('financialGoal')}
        />
        <Input
          label="Savings / investment goal (optional)"
          placeholder="e.g. KSh 500,000 emergency fund by next year"
          {...register('savingsGoal')}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        {!isSubmitting && <UserPlus className="h-4 w-4" />}
        Create account
      </Button>
    </form>
  );
}
