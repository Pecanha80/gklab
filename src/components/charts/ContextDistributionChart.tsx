import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CONTEXT_COLORS: Record<string, string> = {
  gym: '#6366f1',
  warmup: '#f59e0b',
  main: '#10b981',
};

const CONTEXT_LABEL_KEYS: Record<string, string> = {
  gym: 'gym',
  warmup: 'warmup',
  main: 'mainExercises',
};

interface Props {
  data: Array<{ context: string; count: number }>;
  t: (key: string) => string;
}

export const ContextDistributionChart: React.FC<Props> = ({ data, t }) => {
  if (data.length === 0) return <p className="text-sm text-on-surface-variant">{t('analyticsNoData')}</p>;

  const labeled = data.map(d => ({
    ...d,
    label: t(CONTEXT_LABEL_KEYS[d.context] || d.context) || d.context,
  }));

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" minWidth={0} height={140}>
        <PieChart>
          <Pie
            data={labeled}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={55}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={CONTEXT_COLORS[d.context] || '#8b5cf6'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
            labelStyle={{ color: '#cdd6f4' }}
            itemStyle={{ color: '#cdd6f4' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-1.5">
        {labeled.map((d, i) => (
          <div key={d.context} className="flex items-center gap-2 text-[10px]">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CONTEXT_COLORS[d.context] || '#8b5cf6' }} />
            <span className="text-on-surface-variant">{d.label}</span>
            <span className="ml-auto font-bold text-on-surface">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
