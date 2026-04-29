import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ week: string; sessions: number; exercises: number }>;
  t: (key: string) => string;
}

export const WeeklyVolumeChart: React.FC<Props> = ({ data, t }) => {
  if (data.length === 0) return <p className="text-sm text-on-surface-variant">{t('analyticsNoData')}</p>;

  return (
    <ResponsiveContainer width="100%" minWidth={0} height={200}>
      <BarChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="week" tick={{ fill: '#a6adc8', fontSize: 11 }} />
        <YAxis tick={{ fill: '#a6adc8', fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
          labelStyle={{ color: '#cdd6f4' }}
          itemStyle={{ color: '#cdd6f4' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="sessions" name={t('sessionsCount')} fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="exercises" name={t('exercisesCount')} fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
