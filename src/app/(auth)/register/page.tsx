import type { Metadata } from 'next';
import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = { title: 'Create your account' };

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Create your account</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A few details help us personalize your budgeting experience.
        </p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
