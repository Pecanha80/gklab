import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CHART_COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6',
];

interface Props {
  data: Array<{ type: string; count: number }>;
  t: (key: string) => string;
}

export const ExerciseTypeChart: React.FC<Props> = ({ data, t }) => {
  if (data.length === 0) return <p className="text-sm text-on-surface-variant">{t('analyticsNoData')}</p>;

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" minWidth={0} height={160}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius={60}
            innerRadius={30}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
            labelStyle={{ color: '#cdd6f4' }}
            itemStyle={{ color: '#cdd6f4' }}
            formatter={(value: unknown, name: unknown) => [String(value ?? ''), t(String(name ?? '')) || String(name ?? '')]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-1">
        {data.map((d, i) => (
          <div key={d.type} className="flex items-center gap-2 text-[10px]">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-on-surface-variant truncate">{t(d.type) || d.type}</span>
            <span className="ml-auto font-bold text-on-surface">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
