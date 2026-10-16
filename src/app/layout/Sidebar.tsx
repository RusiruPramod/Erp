import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FileSpreadsheet,
  LayoutDashboard,
  Briefcase,
  Receipt,
  FileText,
  Users,
  BookOpen,
  UserCheck,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { label: 'Invoice Studio', to: '/studio', icon: FileSpreadsheet },
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', to: '/projects', icon: Briefcase },
    { label: 'Expenses', to: '/expenses', icon: Receipt },
    { label: 'Documents', to: '/documents', icon: FileText },
    { label: 'Customers', to: '/customers', icon: Users },
    { label: 'Ledger', to: '/ledger', icon: BookOpen },
  ];

  const adminItems = [
    { label: 'Team', to: '/team', icon: UserCheck },
    { label: 'Settings', to: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border bg-white transition-all duration-200 z-30 select-none ${
        isCollapsed ? 'w-18' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!isCollapsed ? (
          <NavLink to="/dashboard" className="flex items-center gap-1">
            <span className="text-xl font-black tracking-tight text-[#FF8C00]">Code</span>
            <span className="text-xl font-black tracking-tight text-[#111111]">Crew</span>
            <span className="ml-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-100 px-1.5 py-0.5 rounded">ERP</span>
          </NavLink>
        ) : (
          <NavLink to="/dashboard" className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white font-black text-sm">
            <span className="text-[#FF8C00]">C</span>C
          </NavLink>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md border border-border text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!isCollapsed && (
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Operations
            </p>
          )}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#FFF4E6] text-[#FF8C00] font-bold'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Nav */}
        {isAdmin && (
          <div>
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Administration
              </p>
            )}
            <nav className="space-y-1">
              {adminItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#FFF4E6] text-[#FF8C00] font-bold'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer / Info */}
      {!isCollapsed && (
        <div className="border-t border-border p-4 text-[11px] text-neutral-400">
          <p className="font-semibold text-neutral-600">CodeCrew Sri Lanka</p>
          <p>LKR Currency • Asia/Colombo</p>
        </div>
      )}
    </aside>
  );
};
