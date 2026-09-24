'use client';

import dynamic from 'next/dynamic';
import { getCategoryInfo } from '@/lib/categories';

const ChartInner = dynamic(() => import('./category-chart-inner'), { ssr: false, loading: () => <div className="h-[260px] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> });

interface CategoryChartProps {
  categorias: Record<string, number>;
}

export default function CategoryChart({ categorias }: CategoryChartProps) {
  const data = Object.entries(categorias ?? {})
    .map(([name, value]) => {
      const info = getCategoryInfo(name);
      return { name: `${info.emoji} ${info.label}`, value: Number(value) || 0, color: info.color };
    })
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  return <ChartInner data={data} />;
}
