import { z } from 'zod';
import { sanitizeText } from '@/lib/sanitize';

const freeText = (max: number) =>
  z.string().trim().max(max).transform(sanitizeText);
const optionalFreeText = (max: number) =>
  z.string().trim().max(max).transform(sanitizeText).optional().or(z.literal(''));

export const employmentStatusEnum = z.enum(['employed', 'self-employed', 'student']);

export const categoryTypeEnum = z.enum([
  'food', 'transport', 'rent', 'utilities', 'savings', 'investment',
  'entertainment', 'health', 'education', 'shopping', 'other',
]);

export const paymentMethodEnum = z.enum([
  'cash', 'card', 'mobile-money', 'bank-transfer', 'other',
]);

/**
 * Registration schema. Employment-specific fields are validated conditionally
 * via superRefine so that, e.g., a Student can't submit a fabricated position.
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name is required').max(120),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .min(7, 'Enter a valid phone number')
      .max(20, 'Enter a valid phone number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    country: z.string().trim().min(2, 'Country is required'),
    currency: z.string().trim().length(3, 'Select a currency').default('KES'),
    employmentStatus: employmentStatusEnum,

    employmentPlace: optionalFreeText(160),
    position: optionalFreeText(120),

    businessName: optionalFreeText(160),
    occupation: optionalFreeText(120),

    institution: optionalFreeText(160),
    course: optionalFreeText(160),

    averageMonthlyBudget: z.coerce
      .number({ invalid_type_error: 'Enter your average monthly budget' })
      .min(0, 'Amount cannot be negative')
      .max(1_000_000_000, 'Enter a realistic amount'),
  })
  .superRefine((data, ctx) => {
    if (data.employmentStatus === 'employed' && !data.employmentPlace?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['employmentPlace'],
        message: 'Place of employment is required for employed users',
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const monthlyBudgetSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  initialAmount: z.coerce.number().min(0, 'Amount cannot be negative'),
});

export const budgetAdditionSchema = z.object({
  budgetId: z.string().min(1),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: optionalFreeText(240),
  date: z.coerce.date().optional(),
});

export const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Select a category'),
  categoryType: categoryTypeEnum.optional(),
  destination: optionalFreeText(120),
  description: optionalFreeText(240),
  paymentMethod: paymentMethodEnum.default('cash'),
  date: z.coerce.date(),
  notes: optionalFreeText(500),
});

export const categorySchema = z.object({
  name: freeText(60).pipe(z.string().min(1, 'Name is required')),
  type: categoryTypeEnum,
  icon: z.string().trim().min(1).default('circle'),
  // Omitted -> leave unchanged (or, on create, "not yet customized"; see
  // effectiveBudgetGroup's fallback-by-type). Explicit `null` -> the user
  // removed this category from any group.
  budgetGroup: z.enum(['needs', 'wants', 'savings']).nullable().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  employmentStatus: employmentStatusEnum.optional(),
  employmentPlace: optionalFreeText(160),
  position: optionalFreeText(120),
  businessName: optionalFreeText(160),
  occupation: optionalFreeText(120),
  institution: optionalFreeText(160),
  course: optionalFreeText(160),
});

export const financialProfileSchema = z.object({
  averageMonthlyBudget: z.coerce.number().min(0).max(1_000_000_000),
  currency: z.string().trim().length(3),
});

/**
 * Avatar is uploaded as a data URI (resized/compressed to a small JPEG or
 * WebP client-side before it ever reaches the server — see AvatarSection).
 * `avatar: null` clears the photo. The 400,000-char cap matches the
 * Mongoose schema's maxlength.
 */
export const avatarUpdateSchema = z.object({
  avatar: z
    .string()
    .max(400_000, 'Image is too large.')
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, 'Unsupported image format.')
    .nullable(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const notificationSettingsSchema = z.object({
  emailReportsEnabled: z.boolean(),
  notifications: z.object({
    budgetWarnings: z.boolean(),
    monthlyReports: z.boolean(),
    spendingAlerts: z.boolean(),
  }),
  appearance: z.enum(['light', 'dark', 'system']),
});

/**
 * All fields optional/independent — the client only sends what actually
 * changed (e.g. just `{ enabled: true }` when flipping the toggle, or just
 * `{ botToken: '...' }` when saving a new token without touching the rest).
 * An empty string for botToken/chatId means "clear this field", so it's
 * distinguished from `undefined` ("leave unchanged") rather than trimmed away.
 */
export const telegramSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  botToken: z.string().trim().max(200, 'That token looks too long.').optional(),
  chatId: z.string().trim().max(100, 'That chat ID looks too long.').optional(),
});

export const aiChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    .max(30, 'Conversation is too long — start a new chat.'),
});
