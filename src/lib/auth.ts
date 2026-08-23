import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { verifyPassword } from '@/lib/password';
import { loginSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    newUser: '/register',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error('Enter a valid email and password.');
        }
        const { email, password } = parsed.data;

        // Rate-limit login attempts per email to slow down credential stuffing.
        const limitResult = await rateLimit(`login:${email.toLowerCase()}`, {
          limit: 8,
          windowMs: 5 * 60_000,
        });
        if (!limitResult.success) {
          throw new Error('Too many attempts. Please try again in a few minutes.');
        }

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
          throw new Error('Invalid email or password.');
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          currency: user.currency,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.currency = (user as any).currency;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).currency = token.currency as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
