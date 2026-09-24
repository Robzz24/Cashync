export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession, clearSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }
    // Check if user has credentials set up
    const credCount = await prisma.webAuthnCredential.count({
      where: { userId: session.id },
    });
    return NextResponse.json({
      authenticated: true,
      user: session,
      hasCredentials: credCount > 0,
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
