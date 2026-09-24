export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const url = new URL(req.url);
    const mes = url.searchParams.get('mes');
    const categoria = url.searchParams.get('categoria');
    const cuenta = url.searchParams.get('cuenta');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const limit = parseInt(url.searchParams.get('limit') ?? '20');

    const where: any = { userId: session.id };
    if (mes) where.mes = mes;
    if (categoria) where.categoria = categoria;
    if (cuenta) where.cuenta = cuenta;
    if (search) {
      where.descripcion = { contains: search, mode: 'insensitive' };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('GET transactions error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { tipo, descripcion, monto, categoria, cuenta, metodoPago, ubicacion } = body;

    if (!tipo || !descripcion || !monto || !categoria || !cuenta) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const transaction = await prisma.transaction.create({
      data: {
        tipo,
        descripcion,
        monto: parseFloat(monto),
        fecha: now,
        mes: monthNames[now.getMonth()] ?? 'January',
        metodoPago: metodoPago ?? (cuenta === 'Efectivo' ? 'Efectivo' : cuenta === 'Tarjeta de Débito' ? 'Debit' : 'Credit'),
        cuenta,
        categoria,
        ubicacion: ubicacion ?? null,
        fuente: 'Manual',
        userId: session.id,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('POST transaction error:', error);
    return NextResponse.json({ error: 'Error creando transacción' }, { status: 500 });
  }
}
