export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { MONTH_NUMBERS } from '@/lib/categories';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Check if already imported
    const existingCount = await prisma.transaction.count({
      where: { userId: session.id, fuente: { not: 'Manual' } },
    });
    if (existingCount > 0) {
      return NextResponse.json({ message: 'Datos ya importados', count: existingCount });
    }

    // Read the historical data file
    const filePath = path.join(process.cwd(), 'data', 'historico.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Archivo histórico no encontrado' }, { status: 404 });
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const records: any[] = JSON.parse(rawData);

    // Insert records
    const created = await prisma.transaction.createMany({
      data: records.map((r: any) => {
        const monthNum = MONTH_NUMBERS[r.mes] ?? 0;
        // Assign a date mid-month for historical data
        const fecha = new Date(2026, monthNum, 15);
        return {
          tipo: r.tipo === 'Ingreso' ? 'Ingreso' : 'Gasto',
          descripcion: r.descripcion ?? 'Sin descripción',
          monto: r.monto ?? 0,
          fecha,
          mes: r.mes ?? 'January',
          metodoPago: r.metodo_pago ?? 'Efectivo',
          cuenta: r.cuenta ?? 'Efectivo',
          categoria: r.categoria ?? 'Otros',
          fuente: r.fuente ?? 'Importado',
          userId: session.id,
        };
      }),
    });

    return NextResponse.json({ message: 'Importación exitosa', count: created.count });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error?.message ?? 'Error de importación' }, { status: 500 });
  }
}
