import { NextResponse } from 'next/server';
import { mergeReminders } from '@/lib/store-reminders';

const SYNC_TOKEN = process.env.SYNC_TOKEN || "my_secret_sync_token";

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${SYNC_TOKEN}`) {
    return NextResponse.json({ detail: "Unauthorized sync token" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.reminders || !Array.isArray(body.reminders)) {
      return NextResponse.json({ detail: "Invalid payload" }, { status: 400 });
    }

    await mergeReminders(body.reminders);
    return NextResponse.json({ success: true, synced_count: body.reminders.length });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
