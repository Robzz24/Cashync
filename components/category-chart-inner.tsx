'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export default function CategoryChartInner({ data }: { data: ChartData[] }) {
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry: ChartData, idx: number) => (
              <Cell key={idx} fill={entry?.color ?? '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30, 20, 60, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: 11,
              color: '#fff',
            }}
            formatter={(value: any) => [`$${Number(value)?.toFixed?.(2) ?? '0.00'}`, 'Monto']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
