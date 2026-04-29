import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ moment: string; count: number }>;
  t: (key: string) => string;
}

export const GameMomentsChart: React.FC<Props> = ({ data, t }) => {
  if (data.length === 0) return <p className="text-sm text-on-surface-variant">{t('analyticsNoData')}</p>;

  const translated = data.map(d => ({ ...d, label: t(d.moment) || d.moment }));

  return (
    <ResponsiveContainer width="100%" minWidth={0} height={200}>
      <RadarChart data={translated} cx="50%" cy="50%" outerRadius="60%">
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="label" tick={{ fill: '#a6adc8', fontSize: 9 }} />
        <PolarRadiusAxis tick={{ fill: '#a6adc8', fontSize: 9 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
          labelStyle={{ color: '#cdd6f4' }}
          itemStyle={{ color: '#cdd6f4' }}
        />
        <Radar dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
      </RadarChart>
    </ResponsiveContainer>
  );
};
