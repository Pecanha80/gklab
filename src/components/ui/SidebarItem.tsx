import { cn } from '../../lib/utils';

export const SidebarItem = ({
  icon: Icon,
  labelKey,
  active = false,
  onClick,
  isCollapsed = false,
  t
}: {
  icon: React.ComponentType<{ className?: string }>,
  labelKey: string,
  active?: boolean,
  onClick?: () => void,
  isCollapsed?: boolean,
  t: (key: string) => string
}) => {
  const label = t(labelKey);
  return (
    <button
      onClick={onClick}
      className={cn(
        "sidebar-item w-full",
        isCollapsed ? "justify-center px-0" : "px-4",
        active && "sidebar-item-active"
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={cn(
        "w-5 h-5 transition-all",
        active ? "text-accent" : "text-on-surface-variant"
      )} />
      {!isCollapsed && (
        <span className={cn(
          "text-sm tracking-tight",
          active ? "font-semibold text-on-surface" : "font-medium"
        )}>
          {label}
        </span>
      )}
    </button>
  );
};
