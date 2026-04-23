import React from 'react';
import { cn } from '../../lib/utils';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  accentColor?: string;
  badge?: string;
}

export const Section = ({ title, children, icon: Icon, className, accentColor, badge }: SectionProps) => (
  <div className={cn(
    "glass-card rounded-2xl overflow-hidden animate-in",
    className
  )}>
    {/* Header with colored accent bar */}
    <div className={cn(
      "flex items-center gap-3 px-6 md:px-8 py-4 border-b border-white/[0.04]",
      "bg-gradient-to-r from-white/[0.02] to-transparent"
    )}>
      <div className={cn(
        "w-1 h-8 rounded-full shrink-0",
        accentColor || "bg-accent"
      )} />
      {Icon && (
        <div className={cn(
          "p-2 rounded-xl border",
          accentColor
            ? `${accentColor.replace('bg-', 'bg-')}/10 border-${accentColor.replace('bg-', '')}/20`
            : "bg-accent/10 border-accent/20"
        )}>
          <Icon className={cn(
            "w-4 h-4",
            accentColor ? accentColor.replace('bg-', 'text-') : "text-accent"
          )} />
        </div>
      )}
      <h4 className="text-xs text-on-surface font-bold uppercase tracking-wider flex-1">{title}</h4>
      {badge && (
        <span className="text-[9px] font-bold text-on-surface-variant/50 bg-white/[0.04] px-2 py-0.5 rounded">
          {badge}
        </span>
      )}
    </div>
    {/* Content */}
    <div className="p-6 md:p-8">
      <div className="grid grid-cols-1 gap-6">
        {children}
      </div>
    </div>
  </div>
);
