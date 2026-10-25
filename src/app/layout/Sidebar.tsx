import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Create Invoice', to: '/invoice', icon: FileText },
  ];

  return (
    <aside className="w-56 h-screen flex flex-col bg-white border-r border-neutral-200 select-none shrink-0 z-30">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-5 border-b border-neutral-200">
        <NavLink to="/dashboard" className="flex items-baseline tracking-tight">
          <span className="text-xl font-black text-neutral-900">Code</span>
          <span className="text-xl font-black text-[#FF8C00] ml-0.5">Crew</span>
        </NavLink>
      </div>

      {/* Navigation (Only Dashboard & Create Invoice) */}
      <div className="flex-1 py-4 px-3">
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 text-[#FF8C00] font-semibold border-r-2 border-[#FF8C00]'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
