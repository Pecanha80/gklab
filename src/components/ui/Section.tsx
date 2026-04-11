import React from 'react';

export const Section = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon?: React.ComponentType<{ className?: string }> }) => (
  <div className="space-y-4 pt-6 border-t border-black/5 first:border-t-0 first:pt-0">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-primary" />}
      <h4 className="text-[10px] text-primary uppercase font-label font-bold tracking-widest">{title}</h4>
    </div>
    <div className="grid grid-cols-1 gap-4">
      {children}
    </div>
  </div>
);
