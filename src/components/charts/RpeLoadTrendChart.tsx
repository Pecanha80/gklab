import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ date: string; avgRpe: number; load: number; cumulativeLoad: number }>;
  t: (key: string) => string;
}

export const RpeLoadTrendChart: React.FC<Props> = ({ data, t }) => {
  if (data.length === 0) return <p className="text-sm text-on-surface-variant">{t('analyticsNoData')}</p>;

  return (
    <ResponsiveContainer width="100%" minWidth={0} height={220}>
      <ComposedChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="date" tick={{ fill: '#a6adc8', fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fill: '#a6adc8', fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#a6adc8', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
          labelStyle={{ color: '#cdd6f4' }}
          itemStyle={{ color: '#cdd6f4' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="load" name={t('sessionLoad')} fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumulativeLoad"
          name={t('cumulativeLoad')}
          stroke="#f43f5e"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
