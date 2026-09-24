export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      include: { _count: { select: { credentials: true } } },
    });
    return NextResponse.json({
      hasUser: !!user,
      hasCredentials: (user?._count?.credentials ?? 0) > 0,
    });
  } catch {
    return NextResponse.json({ hasUser: false, hasCredentials: false });
  }
}
