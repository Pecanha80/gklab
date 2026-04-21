import React from 'react';
import { cn } from '../../lib/utils';

export const Section = ({ title, children, icon: Icon, className }: { title: string, children: React.ReactNode, icon?: React.ComponentType<{ className?: string }>, className?: string }) => (
  <div className={cn("glass-card p-6 md:p-8 rounded-2xl space-y-6 animate-in", className)}>
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 bg-accent/10 rounded-xl border border-accent/20">
          <Icon className="w-4 h-4 text-accent" />
        </div>
      )}
      <h4 className="text-xs text-on-surface font-bold uppercase tracking-wider">{title}</h4>
    </div>
    <div className="grid grid-cols-1 gap-6">
      {children}
    </div>
  </div>
);
