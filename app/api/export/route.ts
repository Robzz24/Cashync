export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { MONTHS_ES, getCategoryInfo } from '@/lib/categories';
import ExcelJS from 'exceljs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.id },
      orderBy: { fecha: 'asc' },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'FinTrack';
    wb.created = new Date();

    const headerFill: ExcelJS.Fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' },
    };
    const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true };

    // ---- Sheet 1: Movimientos ----
    const ws = wb.addWorksheet('Movimientos');
    ws.columns = [
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Mes', key: 'mes', width: 12 },
      { header: 'Tipo', key: 'tipo', width: 10 },
      { header: 'Categoría', key: 'categoria', width: 18 },
      { header: 'Descripción', key: 'descripcion', width: 30 },
      { header: 'Cuenta', key: 'cuenta', width: 20 },
      { header: 'Ubicación', key: 'ubicacion', width: 24 },
      { header: 'Ingreso', key: 'ingreso', width: 12 },
      { header: 'Gasto', key: 'gasto', width: 12 },
    ];
    ws.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    transactions.forEach((t: any) => {
      const cat = getCategoryInfo(t.categoria);
      const esIngreso = t.tipo === 'Ingreso';
      const d = new Date(t.fecha);
      const row = ws.addRow({
        fecha: d,
        mes: MONTHS_ES[t.mes] ?? t.mes,
        tipo: esIngreso ? 'Ingreso' : 'Gasto',
        categoria: cat.label,
        descripcion: t.descripcion ?? '',
        cuenta: t.cuenta ?? '',
        ubicacion: t.ubicacion ?? '',
        ingreso: esIngreso ? t.monto : null,
        gasto: esIngreso ? null : t.monto,
      });
      row.getCell('fecha').numFmt = 'dd/mm/yyyy';
      row.getCell('ingreso').numFmt = '"$"#,##0.00';
      row.getCell('gasto').numFmt = '"$"#,##0.00';
    });

    // ---- Sheet 2: Resumen mensual ----
    const rs = wb.addWorksheet('Resumen mensual');
    rs.columns = [
      { header: 'Mes', key: 'mes', width: 14 },
      { header: 'Ingresos', key: 'ingresos', width: 14 },
      { header: 'Gastos', key: 'gastos', width: 14 },
      { header: 'Balance neto', key: 'balance', width: 16 },
    ];
    rs.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    MONTHS.forEach((m) => {
      const mt = transactions.filter((t: any) => t.mes === m);
      if (mt.length === 0) return;
      const ingresos = mt.filter((t: any) => t.tipo === 'Ingreso').reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
      const gastos = mt.filter((t: any) => t.tipo === 'Gasto').reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
      const row = rs.addRow({
        mes: MONTHS_ES[m] ?? m,
        ingresos,
        gastos,
        balance: ingresos - gastos,
      });
      ['ingresos', 'gastos', 'balance'].forEach((k) => { row.getCell(k).numFmt = '"$"#,##0.00'; });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const fileName = `FinTrack_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Error al exportar' }, { status: 500 });
  }
}
