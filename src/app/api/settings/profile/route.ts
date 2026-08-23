import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { profileUpdateSchema } from '@/lib/validations';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) return jsonError(404, 'User not found.');

    const data = parsed.data;
    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    if (data.employmentStatus) user.employmentStatus = data.employmentStatus;

    // Only touch a field if the client actually sent it — the Settings UI
    // always submits the full field set for the current employment status,
    // so this safely clears fields left blank ('') without wiping fields the
    // client didn't include in this particular request at all.
    if ('employmentPlace' in data) user.employmentPlace = data.employmentPlace || undefined;
    if ('position' in data) user.position = data.position || undefined;
    if ('businessName' in data) user.businessName = data.businessName || undefined;
    if ('occupation' in data) user.occupation = data.occupation || undefined;
    if ('institution' in data) user.institution = data.institution || undefined;
    if ('course' in data) user.course = data.course || undefined;

    await user.save();

    return NextResponse.json({ user });
  });
}
