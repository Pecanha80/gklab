import React from 'react';

export const Field: React.FC<{ label: string; value?: string | string[]; className?: string }> = ({ label, value, className = 'space-y-1' }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div className={className}>
      <p className="text-[10px] text-on-surface/50 uppercase font-label font-bold tracking-wider">
        {label}
      </p>
      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{displayValue}</p>
    </div>
  );
};
