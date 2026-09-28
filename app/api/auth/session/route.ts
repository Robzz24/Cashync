export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession, clearSession } from '@/lib/auth-utils';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }
    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
