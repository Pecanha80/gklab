import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Video,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Library,
  Globe,
  Dumbbell as DumbbellIcon,
  Heart,
  Activity,
  BookOpen,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { SidebarItem } from '../ui/SidebarItem';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) => {
  const { t, changeLanguage, isPortuguese } = useTranslation();
  const { signOut } = useAuth();

  return (
    <aside className={cn(
      "hidden md:flex flex-col fixed left-0 top-0 h-full bg-surface/80 backdrop-blur-xl border-r border-black/5 z-50 transition-all duration-300 ease-in-out",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn("py-8 flex items-center", isSidebarCollapsed ? "px-0 justify-center" : "px-6 justify-between")}>
        {!isSidebarCollapsed && (
          <div>
            <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">GKLAB</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-label mt-1">{t('commandCenter')}</p>
          </div>
        )}
        {isSidebarCollapsed && (
          <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">GK</h1>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem icon={LayoutDashboard} labelKey="dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={DumbbellIcon} labelKey="sessions" active={activeTab === 'Training'} onClick={() => setActiveTab('Training')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Library} labelKey="exerciseLibrary" active={activeTab === 'Exercises'} onClick={() => setActiveTab('Exercises')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Users} labelKey="athletes" active={activeTab === 'Goalkeepers'} onClick={() => setActiveTab('Goalkeepers')} isCollapsed={isSidebarCollapsed} t={t} />
        
        {!isSidebarCollapsed && (
          <p className="px-6 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
            {t('monitoring' as any)}
          </p>
        )}
        <SidebarItem icon={Heart} labelKey="wellnessTab" active={activeTab === 'Wellness'} onClick={() => setActiveTab('Wellness')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Activity} labelKey="rpeTab" active={activeTab === 'RPE'} onClick={() => setActiveTab('RPE')} isCollapsed={isSidebarCollapsed} t={t} />

        <SidebarItem icon={Calendar} labelKey="planning" active={activeTab === 'Planning'} onClick={() => setActiveTab('Planning')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={BookOpen} labelKey="methodology" active={activeTab === 'Methodology'} onClick={() => setActiveTab('Methodology')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Video} labelKey="videos" active={activeTab === 'Videos'} onClick={() => setActiveTab('Videos')} isCollapsed={isSidebarCollapsed} t={t} />
      </nav>

      <div className="mt-auto py-6 border-t border-black/5 space-y-1">
        <button
          onClick={() => changeLanguage(isPortuguese ? 'en' : 'pt')}
          className={cn(
            "flex items-center w-full py-3 transition-all duration-200 ease-in-out font-label text-sm font-semibold group",
            isSidebarCollapsed ? "justify-center px-0" : "px-6",
            "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          )}
          title={isPortuguese ? "Switch to English" : "Mudar para Portugues"}
        >
          <Globe className={cn("w-5 h-5 transition-transform group-hover:scale-110", !isSidebarCollapsed && "mr-3")} />
          {!isSidebarCollapsed && (
            <span className="text-xs font-bold uppercase tracking-widest">
              {isPortuguese ? 'EN' : 'PT'}
            </span>
          )}
        </button>
        <SidebarItem icon={HelpCircle} labelKey="support" active={activeTab === 'Support'} onClick={() => setActiveTab('Support')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={LogOut} labelKey="logout" active={false} onClick={() => signOut()} isCollapsed={isSidebarCollapsed} t={t} />
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "flex items-center w-full py-3 mt-4 transition-all duration-200 ease-in-out font-label text-sm font-semibold group text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
            isSidebarCollapsed ? "justify-center px-0" : "px-6"
          )}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 transition-transform group-hover:scale-110" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              {t('collapse')}
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
