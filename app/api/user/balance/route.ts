export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json({
      saldoInicialEfectivo: user.saldoInicialEfectivo,
      saldoInicialTarjeta: user.saldoInicialTarjeta,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const updates: any = {};
    if (body.saldoInicialEfectivo !== undefined) updates.saldoInicialEfectivo = parseFloat(String(body.saldoInicialEfectivo));
    if (body.saldoInicialTarjeta !== undefined) updates.saldoInicialTarjeta = parseFloat(String(body.saldoInicialTarjeta));

    const user = await prisma.user.update({
      where: { id: session.id },
      data: updates,
    });

    return NextResponse.json({
      saldoInicialEfectivo: user.saldoInicialEfectivo,
      saldoInicialTarjeta: user.saldoInicialTarjeta,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
