import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  Package,
  Truck,
  Wifi,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useErpData } from '../../context/ErpDataContext';
import { AdCampaignExpense } from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csv';
import { CampaignExpenseModal } from '../campaigns/CampaignExpenseModal';
import { toast } from 'sonner';

export const ExpensesPage: React.FC = () => {
  const {
    expenses,
    campaigns,
    orders,
    addExpense,
    updateExpense,
    deleteExpense,
    resetToDefaultSampleData,
  } = useErpData();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<AdCampaignExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<AdCampaignExpense | null>(null);

  // Filtered expenses
  const filteredExpenses = expenses.filter(e => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDesc = e.description?.toLowerCase().includes(term);
      const matchCat = e.category?.toLowerCase().includes(term);
      if (!matchDesc && !matchCat) return false;
    }

    if (categoryFilter !== 'all' && e.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount_lkr || e.amount) || 0), 0);
  const packagingTotal = expenses
    .filter(e => e.category === 'Packaging')
    .reduce((sum, e) => sum + (Number(e.amount_lkr || e.amount) || 0), 0);
  const deliveryTotal = expenses
    .filter(e => e.category === 'Delivery')
    .reduce((sum, e) => sum + (Number(e.amount_lkr || e.amount) || 0), 0);
  const reloadTotal = expenses
    .filter(e => e.category === 'Reload / Internet Expenses')
    .reduce((sum, e) => sum + (Number(e.amount_lkr || e.amount) || 0), 0);

  // Export CSV
  const handleExportCsv = () => {
    const rows = filteredExpenses.map(e => ({
      Date: formatDate(e.expense_date),
      Category: e.category,
      Description: e.description,
      'Amount (LKR)': e.amount_lkr || e.amount,
      Notes: e.notes || '',
    }));
    exportToCsv(`expenses-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Expenses exported to CSV');
  };

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-4 md:p-8 space-y-6">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#FF8C00] flex items-center justify-center shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                Business Expenses
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Track delivery, packaging, and internet/reload operational costs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => {
              resetToDefaultSampleData();
              toast.success('Expenses reset to sample data');
            }}
          >
            Reset Sample Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
            disabled={filteredExpenses.length === 0}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
          >
            + Add Expense
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Delivery, Packaging, Internet/Reload, Total) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <Receipt className="w-3.5 h-3.5 text-neutral-600" />
          </div>
          <div className="text-lg font-bold font-mono text-neutral-900 mt-1">
            {formatLKR(totalAmount)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">All recorded overheads</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Packaging Boxes
            </span>
            <Package className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div className="text-lg font-bold font-mono text-neutral-900 mt-1">
            {formatLKR(packagingTotal)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Anti-static boxes & bubble wrap</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Delivery / Courier
            </span>
            <Truck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold font-mono text-neutral-900 mt-1">
            {formatLKR(deliveryTotal)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Customer prototype dispatch</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Internet & Reload
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-neutral-900 mt-1">
            {formatLKR(reloadTotal)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">WhatsApp & customer support</p>
        </div>
      </div>

      {/* 3. Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search description or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Packaging')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                categoryFilter === 'Packaging'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Packaging
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Delivery')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                categoryFilter === 'Delivery'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Delivery
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Reload / Internet Expenses')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                categoryFilter === 'Reload / Internet Expenses'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Internet / Reload
            </button>
          </div>
        </div>
      </div>

      {/* 4. Expenses Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-100/90 text-neutral-700 font-bold uppercase border-b border-neutral-200 text-[11px]">
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Description</th>
              <th className="px-3 py-3">Associated Campaign / Project</th>
              <th className="px-3 py-3 text-right font-bold">Amount (LKR)</th>
              <th className="px-3 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredExpenses.map(expense => {
              const assignedCampaign = campaigns.find(c => c.id === expense.campaign_id);
              const assignedOrder = orders.find(o => o.id === expense.order_id);

              return (
                <tr key={expense.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-3 py-3.5 whitespace-nowrap text-neutral-600">
                    {formatDate(expense.expense_date)}
                  </td>
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-medium text-neutral-900 max-w-xs">
                    {expense.description}
                  </td>
                  <td className="px-3 py-3.5 whitespace-nowrap text-neutral-500">
                    {assignedOrder ? (
                      <span className="font-semibold text-neutral-800">
                        {assignedOrder.order_name}
                      </span>
                    ) : assignedCampaign ? (
                      <span className="font-semibold text-neutral-800">
                        {assignedCampaign.campaign_code}
                      </span>
                    ) : (
                      <span className="text-neutral-400 italic">General Business Overhead</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                    {formatLKR(expense.amount_lkr || expense.amount)}
                  </td>
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setExpenseToEdit(expense);
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(expense)}
                        className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-neutral-100"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expense Modal (Add / Edit) */}
      <CampaignExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaigns={campaigns}
        orders={orders}
        expenseToEdit={expenseToEdit}
        onSave={async data => {
          if (expenseToEdit) {
            updateExpense(expenseToEdit.id, data as any);
            toast.success('Expense updated');
          } else {
            addExpense(data as any);
            toast.success('Expense recorded');
          }
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
            toast.success('Expense deleted');
            setExpenseToDelete(null);
          }
        }}
        title="Delete Expense Record"
        message={`Are you sure you want to delete "${expenseToDelete?.description}"?`}
        confirmText