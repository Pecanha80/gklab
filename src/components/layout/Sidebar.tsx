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
      "hidden md:flex flex-col fixed left-0 top-0 h-full bg-surface/50 backdrop-blur-2xl border-r border-primary/20 z-50 transition-all duration-300 ease-in-out font-body",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn("py-8 flex items-center mb-4", isSidebarCollapsed ? "px-0 justify-center" : "px-8 justify-between")}>
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span className="text-black font-black text-sm">GK</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-on-surface tracking-tighter leading-none">GKLAB</h1>
              <p className="text-[8px] uppercase tracking-[0.2em] text-primary font-black mt-1 tracking-widest">PRO HUB</p>
            </div>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <span className="text-black font-black text-lg">G</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem icon={LayoutDashboard} labelKey="dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={DumbbellIcon} labelKey="sessions" active={activeTab === 'Training'} onClick={() => setActiveTab('Training')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Library} labelKey="exerciseLibrary" active={activeTab === 'Exercises'} onClick={() => setActiveTab('Exercises')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Users} labelKey="athletes" active={activeTab === 'Goalkeepers'} onClick={() => setActiveTab('Goalkeepers')} isCollapsed={isSidebarCollapsed} t={t} />
        
        {!isSidebarCollapsed && (
          <p className="px-8 pt-6 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">
            {t('monitoring' as any)}
          </p>
        )}
        <SidebarItem icon={Heart} labelKey="wellnessTab" active={activeTab === 'Wellness'} onClick={() => setActiveTab('Wellness')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Activity} labelKey="rpeTab" active={activeTab === 'RPE'} onClick={() => setActiveTab('RPE')} isCollapsed={isSidebarCollapsed} t={t} />

        {!isSidebarCollapsed && (
          <p className="px-8 pt-6 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">
            STRATEGY
          </p>
        )}
        <SidebarItem icon={Calendar} labelKey="planning" active={activeTab === 'Planning'} onClick={() => setActiveTab('Planning')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={BookOpen} labelKey="methodology" active={activeTab === 'Methodology'} onClick={() => setActiveTab('Methodology')} isCollapsed={isSidebarCollapsed} t={t} />
        <SidebarItem icon={Video} labelKey="videos" active={activeTab === 'Videos'} onClick={() => setActiveTab('Videos')} isCollapsed={isSidebarCollapsed} t={t} />
      </nav>

      <div className="mt-auto py-6 border-t border-primary/20 space-y-1">
        <button
          onClick={() => changeLanguage(isPortuguese ? 'en' : 'pt')}
          className={cn(
            "sidebar-item mx-3 mb-1",
            isSidebarCollapsed ? "justify-center px-0" : "px-4"
          )}
          title={isPortuguese ? "Switch to English" : "Mudar para Portugues"}
        >
          <Globe className={cn("w-5 h-5 transition-transform group-hover:scale-110", !isSidebarCollapsed && "mr-3")} />
          {!isSidebarCollapsed && <span className="text-xs font-black">{isPortuguese ? 'EN' : 'PT'}</span>}
        </button>
        <SidebarItem icon={HelpCircle} labelKey="support" active={activeTab === 'Support'} onClick={() => setActiveTab('Support')} isCollapsed={isSidebarCollapsed} t={t} />
        <button
          onClick={() => signOut()}
          className={cn(
            "sidebar-item mx-3 mb-1 text-error hover:text-error hover:bg-error/10",
            isSidebarCollapsed ? "justify-center px-0" : "px-4"
          )}
        >
          <LogOut className={cn("w-5 h-5", !isSidebarCollapsed && "mr-3")} />
          {!isSidebarCollapsed && <span className="text-xs font-black">{t('logout')}</span>}
        </button>
        
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "flex items-center justify-center p-2 mx-auto mt-4 rounded-xl bg-white/5 border border-primary/30 text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-all",
            isSidebarCollapsed ? "w-10" : "w-10 ml-8"
          )}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
