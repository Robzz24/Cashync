export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.id },
    });
    if (!existing) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        tipo: body.tipo ?? existing.tipo,
        descripcion: body.descripcion ?? existing.descripcion,
        monto: body.monto ? parseFloat(body.monto) : existing.monto,
        categoria: body.categoria ?? existing.categoria,
        cuenta: body.cuenta ?? existing.cuenta,
        metodoPago: body.metodoPago ?? existing.metodoPago,
        ubicacion: body.ubicacion !== undefined ? body.ubicacion : existing.ubicacion,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT transaction error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.id },
    });
    if (!existing) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE transaction error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
