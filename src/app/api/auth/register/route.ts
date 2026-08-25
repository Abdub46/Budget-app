import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { registerSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/password';
import { provisionDefaultCategories } from '@/lib/provision-categories';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { ensureStrategy } from '@/lib/budget-engine';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limitResult = await rateLimit(`register:${ip}`, { limit: 10, windowMs: 60 * 60_000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.data ?? parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(data.password);

    // Only persist the fields relevant to the chosen employment status —
    // the User model's pre-save hook also enforces this server-side.
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      phone: data.phone,
      country: data.country,
      currency: data.currency || 'KES',
      employmentStatus: data.employmentStatus,
      employmentPlace: data.employmentStatus === 'employed' ? data.employmentPlace : undefined,
      position: data.employmentStatus === 'employed' ? data.position : undefined,
      businessName: data.employmentStatus === 'self-employed' ? data.businessName : undefined,
      occupation: data.employmentStatus === 'self-employed' ? data.occupation : undefined,
      institution: data.employmentStatus === 'student' ? data.institution : undefined,
      course: data.employmentStatus === 'student' ? data.course : undefined,
      averageMonthlyBudget: data.averageMonthlyBudget,
      monthlyIncome: data.monthlyIncome,
      housingExpense: data.housingExpense,
      foodExpense: data.foodExpense,
      transportExpense: data.transportExpense,
      utilitiesExpense: data.utilitiesExpense,
      debtPayment: data.debtPayment,
      currentSavings: data.currentSavings,
      emergencyFund: data.emergencyFund,
      dependents: data.dependents,
      incomeStability: data.incomeStability,
      financialGoal: data.financialGoal || undefined,
      savingsGoal: data.savingsGoal || undefined,
    });

    await Promise.all([
      provisionDefaultCategories(user._id),
      // Generates the user's first AI-recommended budget allocation right
      // away, from the financial details just collected at onboarding
      // (spec §4). Never blocks registration if it somehow fails — the
      // dashboard falls back to generating it lazily via ensureStrategy().
      ensureStrategy(user._id).catch((err) =>
        console.error(`Could not generate initial budget strategy for user ${user._id}:`, err)
      ),
    ]);

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        user: { id: user._id.toString(), email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while creating your account.' },
      { status: 500 }
    );
  }
}