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
        "flex items-center w-full py-3 transition-all duration-200 ease-in-out font-label text-sm font-semibold group",
        isCollapsed ? "justify-center px-0" : "px-6",
        active
          ? "text-primary border-r-2 border-primary bg-primary/5"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", !isCollapsed && "mr-3", active ? "text-primary" : "text-on-surface-variant")} />
      {!isCollapsed && label}
    </button>
  );
};
