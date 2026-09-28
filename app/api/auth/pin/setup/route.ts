export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, saldoInicialEfectivo, saldoInicialTarjeta } = body;

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN debe ser de 4 dígitos' }, { status: 400 });
    }

    // Si ya existe un usuario, actualizar su PIN y saldos
    const existing = await prisma.user.findFirst();

    const pinHash = await bcrypt.hash(pin, 10);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            pinHash,
            saldoInicialEfectivo: parseFloat(String(saldoInicialEfectivo ?? 0)),
            saldoInicialTarjeta: parseFloat(String(saldoInicialTarjeta ?? 0)),
          },
        })
      : await prisma.user.create({
          data: {
            id: 'cashync-user',
            name: 'Usuario',
            pinHash,
            saldoInicialEfectivo: parseFloat(String(saldoInicialEfectivo ?? 0)),
            saldoInicialTarjeta: parseFloat(String(saldoInicialTarjeta ?? 0)),
          },
        });

    await createSession({ id: user.id, name: user.name });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    console.error('PIN setup error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Error de base de datos al configurar PIN' 
    }, { status: 500 });
  }
}
