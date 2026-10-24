import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FileSpreadsheet,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { label: 'Studio', to: '/studio', icon: FileSpreadsheet },
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[#E5E7EB] bg-white transition-all duration-200 z-30 select-none ${
        isCollapsed ? 'w-14' : 'w-44'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-3">
        {!isCollapsed ? (
          <NavLink to="/studio" className="flex items-center gap-1">
            <span className="text-base font-black tracking-tight text-[#FF8C00]">Code</span>
            <span className="text-base font-black tracking-tight text-[#111111]">Crew</span>
          </NavLink>
        ) : (
          <NavLink to="/studio" className="mx-auto flex h-7 w-7 items-center justify-center rounded bg-neutral-900 text-white font-black text-xs">
            <span className="text-[#FF8C00]">C</span>C
          </NavLink>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded border border-[#E5E7EB] text-neutral-400 hover:bg-[#F8FAFC] hover:text-neutral-700 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Nav (Only Studio & Dashboard) */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                      : 'text-neutral-600 hover:bg-[#F8FAFC] hover:text-neutral-900'
                  } ${isCollapsed ? 'justify-center px-1.5' : ''}`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

