import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FileSpreadsheet,
  LayoutDashboard,
  Briefcase,
  Receipt,
  FileText,
  Users,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

export const MobileNav: React.FC = () => {
  const { isAdmin } = useAuth();

  const items = [
    { label: 'Studio', to: '/studio', icon: FileSpreadsheet },
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', to: '/projects', icon: Briefcase },
    { label: 'Expenses', to: '/expenses', icon: Receipt },
    { label: 'Documents', to: '/documents', icon: FileText },
    { label: isAdmin ? 'Settings' : 'Customers', to: isAdmin ? '/settings' : '/customers', icon: isAdmin ? SettingsIcon : Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 rounded-lg min-w-[56px] text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-[#FF8C00] font-bold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
