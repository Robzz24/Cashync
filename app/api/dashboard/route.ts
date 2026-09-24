export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const url = new URL(req.url);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = url.searchParams.get('mes') ?? monthNames[new Date().getMonth()] ?? 'January';

    const allTransactions = await prisma.transaction.findMany({
      where: { userId: session.id },
    });

    const monthTransactions = allTransactions.filter((t: any) => t.mes === currentMonth);

    const totalIngresos = allTransactions
      .filter((t: any) => t.tipo === 'Ingreso')
      .reduce((sum: number, t: any) => sum + (t.monto ?? 0), 0);

    const totalGastos = allTransactions
      .filter((t: any) => t.tipo === 'Gasto')
      .reduce((sum: number, t: any) => sum + (t.monto ?? 0), 0);

    const mesIngresos = monthTransactions
      .filter((t: any) => t.tipo === 'Ingreso')
      .reduce((sum: number, t: any) => sum + (t.monto ?? 0), 0);

    const mesGastos = monthTransactions
      .filter((t: any) => t.tipo === 'Gasto')
      .reduce((sum: number, t: any) => sum + (t.monto ?? 0), 0);

    // Category breakdown for the month
    const categorias: Record<string, number> = {};
    monthTransactions
      .filter((t: any) => t.tipo === 'Gasto')
      .forEach((t: any) => {
        const cat = t.categoria ?? 'Otros';
        categorias[cat] = (categorias[cat] ?? 0) + (t.monto ?? 0);
      });

    // Last 10 transactions overall
    const recientes = allTransactions
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10);

    // Monthly trend
    const monthlyTrend = monthNames.map((m: string) => {
      const mt = allTransactions.filter((t: any) => t.mes === m);
      return {
        mes: m,
        ingresos: mt.filter((t: any) => t.tipo === 'Ingreso').reduce((s: number, t: any) => s + (t.monto ?? 0), 0),
        gastos: mt.filter((t: any) => t.tipo === 'Gasto').reduce((s: number, t: any) => s + (t.monto ?? 0), 0),
      };
    }).filter((m: any) => m.ingresos > 0 || m.gastos > 0);

    return NextResponse.json({
      balance: totalIngresos - totalGastos,
      totalIngresos,
      totalGastos,
      mesIngresos,
      mesGastos,
      mesSaldo: mesIngresos - mesGastos,
      categorias,
      recientes,
      monthlyTrend,
      currentMonth,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
