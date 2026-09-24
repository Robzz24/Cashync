'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  mes: string;
  Ingresos: number;
  Gastos: number;
}

export default function MonthlyChartInner({ data }: { data: ChartData[] }) {
  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <XAxis dataKey="mes" tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} />
          <YAxis tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30, 20, 60, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: 11,
              color: '#fff',
            }}
            formatter={(value: any) => [`$${Number(value)?.toFixed?.(2) ?? '0.00'}`]}
          />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }} />
          <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
