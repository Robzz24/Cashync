'use client';

import dynamic from 'next/dynamic';
import { MONTHS_ES } from '@/lib/categories';

const ChartInner = dynamic(() => import('./monthly-chart-inner'), { ssr: false, loading: () => <div className="h-[220px] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> });

interface MonthlyChartProps {
  data: Array<{ mes: string; ingresos: number; gastos: number }>;
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = (data ?? []).map((d: any) => ({
    mes: (MONTHS_ES[d?.mes] ?? d?.mes ?? '').substring(0, 3),
    Ingresos: Number(d?.ingresos) || 0,
    Gastos: Number(d?.gastos) || 0,
  }));

  if (chartData.length === 0) return null;

  return <ChartInner data={chartData} />;
}
