export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'PIN inválido' }, { status: 400 });
    }

    const user = await prisma.user.findFirst();
    if (!user || !user.pinHash) {
      return NextResponse.json({ error: 'No hay PIN configurado', needsSetup: true }, { status: 400 });
    }

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }

    await createSession({ id: user.id, name: user.name });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PIN verify error:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al verificar PIN' }, { status: 500 });
  }
}
