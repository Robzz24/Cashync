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

    const url = new URL(req.url);
    const upToMonth = url.searchParams.get('mes') ?? MONTHS[new Date().getMonth()] ?? 'September';
    const upToIdx = MONTHS.indexOf(upToMonth);
    const activeMonths = MONTHS.slice(0, upToIdx + 1);

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    const saldoInicialEfectivo = user?.saldoInicialEfectivo ?? 0;
    const saldoInicialTarjeta = user?.saldoInicialTarjeta ?? 0;

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.id },
      orderBy: { fecha: 'asc' },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Cashync';
    wb.created = new Date();

    const headerFill: ExcelJS.Fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' },
    };
    const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true };
    const usdFmt = '"$"#,##0.00';

    const applyHeader = (ws: ExcelJS.Worksheet) => {
      ws.getRow(1).eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    };

    // Helper: get transactions for a specific month and account type
    const getMonthTx = (m: string, tipo?: string, isCard?: boolean) => {
      return transactions.filter((t: any) => {
        const mesMatch = t.mes === m || t.mes === m + ' ';
        const tipoMatch = tipo ? t.tipo === tipo : true;
        const cuentaMatch = isCard !== undefined
          ? isCard ? t.cuenta !== 'Efectivo' : t.cuenta === 'Efectivo'
          : true;
        return mesMatch && tipoMatch && cuentaMatch;
      });
    };

    // ---- Sheet 1: General budget ----
    const ws1 = wb.addWorksheet('General budget');
    ws1.columns = [
      { header: 'Month', key: 'month', width: 14 },
      { header: 'Beggining of month', key: 'bom', width: 20 },
      { header: 'Income', key: 'income', width: 14 },
      { header: 'Expenses', key: 'expenses', width: 14 },
      { header: 'Int. Debt', key: 'intDebt', width: 12 },
      { header: 'Ext. Debt', key: 'extDebt', width: 12 },
      { header: 'End of month', key: 'eom', width: 16 },
      { header: 'End of month with debt', key: 'eomDebt', width: 22 },
    ];
    applyHeader(ws1);

    let runningBalance = saldoInicialEfectivo;
    activeMonths.forEach((m) => {
      const cashIncome = getMonthTx(m, 'Ingreso', false)
        .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
      const cashExpense = getMonthTx(m, 'Gasto', false)
        .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
      const bom = runningBalance;
      const eom = bom + cashIncome - cashExpense;
      const row = ws1.addRow({
        month: m,
        bom,
        income: cashIncome,
        expenses: cashExpense,
        intDebt: 0,
        extDebt: 0,
        eom,
        eomDebt: eom,
      });
      ['bom', 'income', 'expenses', 'intDebt', 'extDebt', 'eom', 'eomDebt'].forEach((k) => {
        row.getCell(k).numFmt = usdFmt;
      });
      runningBalance = eom;
    });

    // Fill remaining months with zeros
    MONTHS.slice(upToIdx + 1).forEach((m) => {
      const row = ws1.addRow({ month: m, bom: 0, income: 0, expenses: 0, intDebt: 0, extDebt: 0, eom: 0, eomDebt: 0 });
      ['bom', 'income', 'expenses', 'intDebt', 'extDebt', 'eom', 'eomDebt'].forEach((k) => {
        row.getCell(k).numFmt = usdFmt;
      });
    });

    // ---- Sheet 2: Money movement ----
    const ws2 = wb.addWorksheet('Money movement');
    ws2.mergeCells('A1:A1');
    ws2.getCell('A1').value = 'Money movement';
    ws2.getCell('A1').font = { bold: true, size: 14 };
    ws2.getCell('D1').value = 'Cash';
    ws2.getCell('D1').font = { bold: true };

    // Income section
    ws2.getCell('A3').value = 'Income';
    ws2.getCell('A3').font = { bold: true, size: 12 };

    const incomeHeaderRow = ws2.getRow(4);
    ['Month', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Total'].forEach((h, ci) => {
      const cell = incomeHeaderRow.getCell(ci + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center' };
    });

    MONTHS.forEach((m, mi) => {
      const cashIncomes = getMonthTx(m, 'Ingreso', false);
      // Try to distribute by week based on description
      const weeks = [0, 0, 0, 0];
      let total = 0;
      cashIncomes.forEach((t: any) => {
        const desc = (t.descripcion ?? '').toLowerCase();
        const monto = t.monto ?? 0;
        total += monto;
        if (desc.includes('semana 2') || desc.includes('week 2')) weeks[1] += monto;
        else if (desc.includes('semana 3') || desc.includes('week 3')) weeks[2] += monto;
        else if (desc.includes('semana 4') || desc.includes('week 4')) weeks[3] += monto;
        else weeks[0] += monto;
      });
      const row = ws2.getRow(5 + mi);
      row.getCell(1).value = m;
      row.getCell(2).value = weeks[0] || null;
      row.getCell(3).value = weeks[1] || null;
      row.getCell(4).value = weeks[2] || null;
      row.getCell(5).value = weeks[3] || null;
      row.getCell(6).value = total;
      for (let c = 2; c <= 6; c++) row.getCell(c).numFmt = usdFmt;
    });

    // Vault info (if any savings)
    const vaultTx = transactions.filter((t: any) => t.categoria === 'Vault');
    if (vaultTx.length > 0) {
      const vaultTotal = vaultTx.reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
      ws2.getCell('G6').value = 'In vault';
      ws2.getCell('H6').value = vaultTotal;
      ws2.getCell('H6').numFmt = usdFmt;
    }

    // Outcome section
    const outcomeStartRow = 19;
    ws2.getCell(`A${outcomeStartRow}`).value = 'Outcome';
    ws2.getCell(`A${outcomeStartRow}`).font = { bold: true, size: 12 };

    const outcomeHeaderRow = ws2.getRow(outcomeStartRow + 1);
    ['Product', 'Price', 'Month', 'Category'].forEach((h, ci) => {
      const cell = outcomeHeaderRow.getCell(ci + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center' };
    });

    let outcomeRow = outcomeStartRow + 2;
    const cashExpenses = transactions.filter((t: any) => t.tipo === 'Gasto' && t.cuenta === 'Efectivo');
    cashExpenses.forEach((t: any) => {
      const row = ws2.getRow(outcomeRow++);
      const cat = getCategoryInfo(t.categoria);
      row.getCell(1).value = t.descripcion ?? '';
      row.getCell(2).value = t.monto ?? 0;
      row.getCell(2).numFmt = usdFmt;
      row.getCell(3).value = t.mes ?? '';
      row.getCell(4).value = cat.label;
    });

    // Set column widths for ws2
    ws2.getColumn(1).width = 20;
    ws2.getColumn(2).width = 12;
    ws2.getColumn(3).width = 12;
    ws2.getColumn(4).width = 12;
    ws2.getColumn(5).width = 12;
    ws2.getColumn(6).width = 12;
    ws2.getColumn(7).width = 14;
    ws2.getColumn(8).width = 12;

    // ---- Sheet 3: Cards ----
    const ws3 = wb.addWorksheet('Cards');
    ws3.getCell('A1').value = 'Debit and credit card Expenses';
    ws3.getCell('A1').font = { bold: true, size: 12 };

    // Card balance
    const totalCardIncome = transactions
      .filter((t: any) => t.tipo === 'Ingreso' && t.cuenta !== 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
    const totalCardExpense = transactions
      .filter((t: any) => t.tipo === 'Gasto' && t.cuenta !== 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
    const cardBalance = saldoInicialTarjeta + totalCardIncome - totalCardExpense;

    ws3.getCell('E1').value = 'Debit card income';
    ws3.getCell('E1').font = { bold: true };
    ws3.getCell('H1').value = cardBalance;
    ws3.getCell('H1').numFmt = usdFmt;
    ws3.getCell('H1').font = { bold: true, size: 14 };

    const cardHeaderRow = ws3.getRow(2);
    ['Month', 'Amount Debit', 'Amount Credit'].forEach((h, ci) => {
      const cell = cardHeaderRow.getCell(ci + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center' };
    });

    MONTHS.forEach((m, mi) => {
      const debitExpense = transactions
        .filter((t: any) => (t.mes === m || t.mes === m + ' ') && t.tipo === 'Gasto' && t.cuenta === 'Tarjeta de Débito')
        .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
      const creditExpense = transactions
        .filter((t: any) => (t.mes === m || t.mes === m + ' ') && t.tipo === 'Gasto' && t.cuenta === 'Tarjeta de Crédito')
        .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
      const row = ws3.getRow(3 + mi);
      row.getCell(1).value = m;
      row.getCell(2).value = debitExpense;
      row.getCell(2).numFmt = usdFmt;
      row.getCell(3).value = creditExpense;
      row.getCell(3).numFmt = usdFmt;
    });

    ws3.getColumn(1).width = 14;
    ws3.getColumn(2).width = 16;
    ws3.getColumn(3).width = 16;
    ws3.getColumn(4).width = 4;
    ws3.getColumn(5).width = 20;
    ws3.getColumn(8).width = 16;

    // ---- Sheet 4: Expenses detail (CARD) ----
    const ws4 = wb.addWorksheet('Expenses detail ( CARD)');

    const detailHeaderRow = ws4.getRow(1);
    ['Product', 'Price', 'Month', 'Type'].forEach((h, ci) => {
      const cell = detailHeaderRow.getCell(ci + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center' };
    });

    // Totals in row 1
    ws4.getCell('G1').value = 'TOTAL GASTADO';
    ws4.getCell('G1').font = { bold: true };
    const totalCardSpent = transactions
      .filter((t: any) => t.tipo === 'Gasto' && t.cuenta !== 'Efectivo')
      .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
    ws4.getCell('H1').value = totalCardSpent;
    ws4.getCell('H1').numFmt = usdFmt;
    ws4.getCell('H1').font = { bold: true };

    ws4.getCell('J1').value = 'TOTAL TARJETA';
    ws4.getCell('J1').font = { bold: true };
    ws4.getCell('K1').value = cardBalance;
    ws4.getCell('K1').numFmt = usdFmt;
    ws4.getCell('K1').font = { bold: true };

    const cardExpenses = transactions.filter((t: any) => t.tipo === 'Gasto' && t.cuenta !== 'Efectivo');
    cardExpenses.forEach((t: any, i: number) => {
      const row = ws4.getRow(2 + i);
      row.getCell(1).value = t.descripcion ?? '';
      row.getCell(2).value = t.monto ?? 0;
      row.getCell(2).numFmt = usdFmt;
      row.getCell(3).value = t.mes ?? '';
      row.getCell(4).value = t.cuenta === 'Tarjeta de Crédito' ? 'Credit' : 'Debit';
    });

    ws4.getColumn(1).width = 24;
    ws4.getColumn(2).width = 12;
    ws4.getColumn(3).width = 14;
    ws4.getColumn(4).width = 10;
    ws4.getColumn(7).width = 16;
    ws4.getColumn(8).width = 14;
    ws4.getColumn(10).width = 16;
    ws4.getColumn(11).width = 14;

    // ---- Sheet 5: Expenses and income GENERAL ----
    const ws5 = wb.addWorksheet('Expenses and income GENERAL');

    const genHeaderRow = ws5.getRow(3);
    ['Month', 'Suma de Income', 'Suma de Expenses'].forEach((h, ci) => {
      const cell = genHeaderRow.getCell(ci + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center' };
    });

    let grandIncome = 0;
    let grandExpenses = 0;

    MONTHS.forEach((m, mi) => {
      const cashIncome = getMonthTx(m, 'Ingreso', false)
        .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
      const cashExpense = getMonthTx(m, 'Gasto', false)
        .reduce((s: number, t: any) => s + (t.monto ?? 0), 0);
      grandIncome += cashIncome;
      grandExpenses += cashExpense;
      const row = ws5.getRow(4 + mi);
      row.getCell(1).value = m;
      row.getCell(2).value = cashIncome;
      row.getCell(2).numFmt = usdFmt;
      row.getCell(3).value = cashExpense;
      row.getCell(3).numFmt = usdFmt;
    });

    const totalRow = ws5.getRow(16);
    totalRow.getCell(1).value = 'Grand Total';
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(2).value = grandIncome;
    totalRow.getCell(2).numFmt = usdFmt;
    totalRow.getCell(2).font = { bold: true };
    totalRow.getCell(3).value = grandExpenses;
    totalRow.getCell(3).numFmt = usdFmt;
    totalRow.getCell(3).font = { bold: true };

    ws5.getColumn(1).width = 14;
    ws5.getColumn(2).width = 18;
    ws5.getColumn(3).width = 18;

    const buffer = await wb.xlsx.writeBuffer();
    const fileName = `Cashync_${MONTHS_ES[upToMonth] ?? upToMonth}_2026.xlsx`;

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
