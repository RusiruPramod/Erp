import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Filter,
  Edit2,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DateRangePicker, DateRange } from '../../components/ui/DateRangePicker';
import { QuickAddExpenseRow } from './QuickAddExpenseRow';
import { ExpenseFormModal } from './ExpenseFormModal';
import { Expense } from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csv';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'sonner';

export const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Projects list for filter dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-select'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Query expenses with filters
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: [
      'expenses',
      dateRange.startDate,
      dateRange.endDate,
      searchTerm,
      projectFilter,
      typeFilter,
      platformFilter,
    ],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: 'exp-1',
            project_id: '00000000-0000-0000-0000-000000000010',
            expense_date: new Date().toISOString(),
            type: 'advertisement' as const,
            platform: 'Facebook' as const,
            category: null,
            description: 'Targeted Lead Ad Campaign - IT Support Colombo',
            amount: 3500,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            projects: { name: 'Google Workspace File Sync' },
          },
        ];
      }

      let query = supabase
        .from('expenses')
        .select('*, projects(name)')
        .gte('expense_date', dateRange.startDate)
        .lte('expense_date', dateRange.endDate)
        .order('expense_date', { ascending: false });

      if (searchTerm) {
        query = query.ilike('description', `%${searchTerm}%`);
      }

      if (projectFilter !== 'all') {
        if (projectFilter === 'general') {
          query = query.is('project_id', null);
        } else {
          query = query.eq('project_id', projectFilter);
        }
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Totals calculation
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const adSpendTotal = expenses
    .filter(e => e.type === 'advertisement')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const generalTotal = expenses
    .filter(e => e.type === 'other')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['project_summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Expense deleted');
      setDeletingExpense(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete expense');
    },
  });

  const handleExportCsv = () => {
    const rows = expenses.map(e => ({
      date: formatDate(e.expense_date),
      type: e.type,
      platform_or_category: e.platform || e.category || 'General',
      project: (e as any).projects?.name || 'General Overhead',
      description: e.description,
      amount: e.amount,
    }));

    exportToCsv(
      `codecrew-expenses-${dateRange.startDate}-to-${dateRange.endDate}`,
      rows,
      [
        { key: 'date', label: 'Date' },
        { key: 'project', label: 'Project' },
        { key: 'type', label: 'Type' },
        { key: 'platform_or_category', label: 'Platform / Category' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount (LKR)' },
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Expenses
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Log advertisement spend and business overhead date-wise.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
            disabled={expenses.length === 0}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Date Range & Total Summary Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-xs">
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">
              Ad Spend (Outcome)
            </span>
            <span className="font-mono font-bold text-[#FF8C00]">
              {formatLKR(adSpendTotal)}
            </span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">
              Other Expenses
            </span>
            <span className="font-mono font-bold text-neutral-800">
              {formatLKR(generalTotal)}
            </span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">
              Grand Total
            </span>
            <span className="font-mono font-black text-neutral-950 text-sm">
              {formatLKR(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Add Row */}
      <QuickAddExpenseRow />

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-border shadow-xs">
        <div className="relative">
          <Input
            placeholder="Search description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-9 text-xs"
          />
        </div>

        <Select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          className="h-9 text-xs"
        >
          <option value="all">All Projects & Overhead</option>
          <option value="general">General Overhead (No Project)</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <Select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="h-9 text-xs"
        >
          <option value="all">All Expense Types</option>
          <option value="advertisement">Advertisement</option>
          <option value="other">Other</option>
        </Select>

        <Select
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value)}
          className="h-9 text-xs"
        >
          <option value="all">All Platforms</option>
          <option value="Facebook">Facebook</option>
          <option value="Instagram">Instagram</option>
          <option value="Google">Google Ads</option>
          <option value="TikTok">TikTok</option>
          <option value="YouTube">YouTube</option>
          <option value="Other">Other</option>
        </Select>
      </div>

      {/* Expenses Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="No expenses found"
          description="Log your daily ad spend or overhead using the quick add row above."
          actionLabel="Add Expense"
          onAction={() => {
            setExpenseToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Type / Platform</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount (LKR)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-xs text-neutral-600">
                  {formatDate(e.expense_date)}
                </TableCell>
                <TableCell>
                  {(e as any).projects?.name ? (
                    <span className="font-semibold text-neutral-900 text-xs">
                      {(e as any).projects.name}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400 italic">
                      General Overhead
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
                    {e.platform || e.category || 'General'}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-medium text-neutral-800">
                  {e.description}
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-bold text-neutral-900">
                  {formatLKR(e.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setExpenseToEdit(e);
                        setIsModalOpen(true);
                      }}
                      title="Edit Expense"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingExpense(e)}
                      title="Delete Expense"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Expense Modal */}
      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={() => deletingExpense && deleteMutation.mutate(deletingExpense.id)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record?"
        confirmText="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
