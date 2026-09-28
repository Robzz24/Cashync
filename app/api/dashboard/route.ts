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

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    const saldoInicialEfectivo = user?.saldoInicialEfectivo ?? 0;
    const saldoInicialTarjeta = user?.saldoInicialTarjeta ?? 0;

    const allTransactions = await prisma.transaction.findMany({
      where: { userId: session.id },
    });

    const monthTransactions = allTransactions.filter((t: any) => t.mes === currentMonth);

    // --- Accumulated totals (all time) ---
    const totalIngresoEfectivo = allTransactions
      .filter((t: any) => t.tipo === 'Ingreso' && t.cuenta === 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
    const totalGastoEfectivo = allTransactions
      .filter((t: any) => t.tipo === 'Gasto' && t.cuenta === 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
    const totalIngresoTarjeta = allTransactions
      .filter((t: any) => t.tipo === 'Ingreso' && t.cuenta !== 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
    const totalGastoTarjeta = allTransactions
      .filter((t: any) => t.tipo === 'Gasto' && t.cuenta !== 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);

    const saldoEfectivoTotal = saldoInicialEfectivo + totalIngresoEfectivo - totalGastoEfectivo;
    const saldoTarjetaTotal = saldoInicialTarjeta + totalIngresoTarjeta - totalGastoTarjeta;

    // --- Monthly breakdown ---
    const mesIngresoEfectivo = monthTransactions
      .filter((t: any) => t.tipo === 'Ingreso' && t.cuenta === 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
    const mesGastoEfectivo = monthTransactions
      .filter((t: any) => t.tipo === 'Gasto' && t.cuenta === 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
    const mesIngresoTarjeta = monthTransactions
      .filter((t: any) => t.tipo === 'Ingreso' && t.cuenta !== 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
    const mesGastoTarjeta = monthTransactions
      .filter((t: any) => t.tipo === 'Gasto' && t.cuenta !== 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);

    const mesIngresos = mesIngresoEfectivo + mesIngresoTarjeta;
    const mesGastos = mesGastoEfectivo + mesGastoTarjeta;

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
      saldoEfectivoTotal,
      saldoTarjetaTotal,
      mesIngresos,
      mesGastos,
      mesSaldo: mesIngresos - mesGastos,
      mesIngresoEfectivo,
      mesGastoEfectivo,
      mesIngresoTarjeta,
      mesGastoTarjeta,
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
