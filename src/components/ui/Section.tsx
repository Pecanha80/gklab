import React from 'react';
import { cn } from '../../lib/utils';

export const Section = ({ title, children, icon: Icon, className }: { title: string, children: React.ReactNode, icon?: React.ComponentType<{ className?: string }>, className?: string }) => (
  <div className={cn("glass-card p-6 md:p-8 rounded-[2rem] space-y-6 border-primary/50 animate-in", className)}>
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      )}
      <h4 className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">{title}</h4>
    </div>
    <div className="grid grid-cols-1 gap-6">
      {children}
    </div>
  </div>
);
