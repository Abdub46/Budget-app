import { NextResponse } from 'next/server';
import { Types } from 'mongoose';

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/**
 * Parses `page` and `limit` query params with sane bounds, so no client can
 * request an unbounded result set.
 */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limitRaw = parseInt(searchParams.get('limit') ?? '20', 10) || 20;
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Wraps a route handler body, converting thrown errors (including the
 * Unauthorized error from requireUserId) into consistent JSON responses and
 * logging unexpected failures server-side without leaking internals.
 */
export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.status ?? 500;
    if (status === 401) return jsonError(401, 'Unauthorized');
    if (error?.code === 11000) return jsonError(409, 'This record already exists.');
    console.error('API error:', error);
    return jsonError(status === 500 ? 500 : status, error?.message || 'Something went wrong.');
  }
}
