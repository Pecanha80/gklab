import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ title: string; count: number }>;
  t: (key: string) => string;
}

export const TopDrillsChart: React.FC<Props> = ({ data, t }) => {
  if (data.length === 0) return <p className="text-sm text-on-surface-variant">{t('analyticsNoData')}</p>;

  return (
    <ResponsiveContainer width="100%" minWidth={0} height={Math.max(180, data.length * 24)}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis type="number" tick={{ fill: '#a6adc8', fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="title"
          width={130}
          tick={{ fill: '#a6adc8', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
          labelStyle={{ color: '#cdd6f4' }}
          itemStyle={{ color: '#cdd6f4' }}
          formatter={(value) => [String(value ?? ''), t('sessionsCount')]}
        />
        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
