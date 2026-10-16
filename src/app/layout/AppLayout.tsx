import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { Plus } from 'lucide-react';
import { ExpenseFormModal } from '../../features/expenses/ExpenseFormModal';

export const AppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] overflow-hidden text-primary">
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onQuickAddExpense={() => setIsExpenseModalOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6 pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Floating Action Button (FAB) for Quick Add Expense */}
        <div className="md:hidden fixed bottom-18 right-4 z-40">
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            aria-label="Add Expense"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8C00] text-white shadow-lg hover:bg-[#E07B00] active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-[#FF8C00]/30"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>

      {/* Global Quick Add Expense Modal */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
    </div>
  );
};
