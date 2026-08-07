import { NextResponse } from 'next/server';

const APP_PASSCODE = process.env.APP_PASSCODE || "1234";

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json();
    if (passcode === APP_PASSCODE) {
      return NextResponse.json({ success: true, message: "Authenticated" });
    }
    return NextResponse.json({ detail: "Invalid passcode" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ detail: "Bad Request" }, { status: 400 });
  }
}
