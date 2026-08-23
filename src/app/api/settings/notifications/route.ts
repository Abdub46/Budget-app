import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { notificationSettingsSchema } from '@/lib/validations';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = notificationSettingsSchema.partial().safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) return jsonError(404, 'User not found.');

    const data = parsed.data;
    if (data.emailReportsEnabled !== undefined) {
      user.settings.emailReportsEnabled = data.emailReportsEnabled;
    }
    if (data.notifications) {
      user.settings.notifications = { ...user.settings.notifications, ...data.notifications };
    }
    if (data.appearance) {
      user.settings.appearance = data.appearance;
    }

    await user.save();

    return NextResponse.json({ settings: user.settings });
  });
}
