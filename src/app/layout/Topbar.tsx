import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { LogOut, Plus, User, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface TopbarProps {
  onQuickAddExpense: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onQuickAddExpense }) => {
  const { profile, signOut, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-white px-4 md:px-6 shadow-xs">
      {/* Mobile brand text */}
      <div className="flex md:hidden items-center gap-1">
        <span className="text-lg font-black text-[#FF8C00]">Code</span>
        <span className="text-lg font-black text-[#111111]">Crew</span>
      </div>

      {/* Center / Search / Breadcrumb spacer */}
      <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500">
        <span className="font-semibold text-neutral-700">Internal ERP</span>
        <span>•</span>
        <span>Sri Lanka (Asia/Colombo)</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Add Expense button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onQuickAddExpense}
        >
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Expense</span>
        </Button>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 rounded-lg border border-border p-1.5 hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-white font-bold text-xs">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight pr-1">
              <p className="font-semibold text-neutral-800 line-clamp-1">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-neutral-400 capitalize">
                {isAdmin ? 'Admin' : 'Member'}
              </p>
            </div>
          </button>

          {/* User Dropdown */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-white p-2 shadow-lg z-40 animate-in fade-in zoom-in-95">
                <div className="border-b border-border px-3 py-2 mb-1">
                  <p className="text-xs font-bold text-neutral-900">
                    {profile?.full_name}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate">
                    {profile?.email}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#FF8C00]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isAdmin ? 'System Administrator' : 'Team Member'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
