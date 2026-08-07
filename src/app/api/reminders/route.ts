import { NextResponse } from 'next/server';
import { getReminders, updateReminder } from '@/lib/store-reminders';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reminders = await getReminders();
  return NextResponse.json(reminders);
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ detail: "Missing id" }, { status: 400 });
    }
    const success = await updateReminder(body.id, body);
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ detail: "Reminder not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ detail: "Bad Request" }, { status: 400 });
  }
}
