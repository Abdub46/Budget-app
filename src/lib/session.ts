import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Returns the current session, or null. Use in Server Components and
 * Route Handlers — never trust a client-supplied user ID instead.
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Returns the authenticated user's ID, or throws a 401-flavored error.
 * Every API route that touches financial data should call this first and
 * use the returned ID in every DB query — never accept a userId from the
 * request body/params for ownership purposes.
 */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    const err = new Error('Unauthorized');
    (err as any).status = 401;
    throw err;
  }
  return userId as string;
}
