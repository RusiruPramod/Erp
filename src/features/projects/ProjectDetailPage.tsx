import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Plus,
  Receipt,
  FileText,
  Calendar,
  User,
  MessageCircle,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Skeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getStatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PaymentModal } from './PaymentModal';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import { QuickAddExpenseRow } from '../expenses/QuickAddExpenseRow';
import { formatLKR, formatDate } from '../../lib/formatters';
import { formatPhoneDisplay } from '../../lib/phone';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<any | null>(null);

  // 1. Fetch Project Details & Summary
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return {
          id: id || '00000000-0000-0000-0000-000000000010',
          name: 'Google Workspace File Sync',
          customer_id: '00000000-0000-0000-0000-000000000005',
          customer_name: 'Shamshard Marikkar (Managing Director)',
          customer_company: 'InterMax (Pvt) Ltd.',
          customer_phone: '94772078626',
          project_date: new Date().toISOString(),
          income: 30000,
          total_paid: 15000,
          balance: 15000,
          total_expenses: 3500,
          net_profit: 26500,
          margin_pct: 88.33,
          status: 'active',
          notes: 'Migration & desktop file stream synchronization configuration for InterMax teams.',
        };
      }
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch Project Expenses
  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['project-expenses', id],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: 'exp-1',
            expense_date: new Date().toISOString(),
            type: 'advertisement',
            platform: 'Facebook',
            description: 'Targeted Lead Ad Campaign - IT Support Colombo & Battaramulla',
            amount: 3500,
          },
        ];
      }
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', id)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Fetch Project Income Payments
  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['project-payments', id],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: 'pay-1',
            payment_date: new Date().toISOString(),
            amount: 15000,
            note: '50% Advance Bank Transfer',
          },
        ];
      }
      const { data, error } = await supabase
        .from('income_payments')
        .select('*')
        .eq('project_id', id)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // 4. Fetch Project Documents (Quotations & Invoices)
  const { data: documents = [], isLoading: isDocumentsLoading } = useQuery({
    queryKey: ['project-documents', id],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: 'doc-1',
            number: 'INV-2026-001',
            type: 'invoice',
            total: 30000,
            status: 'partially_paid',
            issue_date: new Date().toISOString(),
          },
        ];
      }
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', id)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Expense deleted');
      setDeletingExpense(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete expense');
    },
  });

  if (isProjectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-base font-bold text-neutral-800">Project Not Found</h2>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'expenses', label: 'Expenses', count: expenses.length },
    { id: 'documents', label: 'Documents', count: documents.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
              {project.name}
            </h1>
            <div>{getStatusBadge(project.status)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<DollarSign className="w-4 h-4 text-emerald-600" />}
            onClick={() => setIsPaymentModalOpen(true)}
          >
            Record Payment
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Strip - Pricing Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Client Price */}
            <Card className="border-l-4 border-l-[#FF8C00]">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Client Price
              </span>
              <p className="text-lg md:text-xl font-black text-neutral-900 font-mono mt-1">
                {formatLKR(project.income)}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Invoice total to client</p>
            </Card>

            {/* Outsourcer Cost */}
            <Card className="border-l-4 border-l-blue-500">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Outsourcer
              </span>
              <p className="text-lg md:text-xl font-black text-blue-600 font-mono mt-1">
                {formatLKR(project.outsourcer_cost ?? 0)}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {project.outsourcer_name || 'Not assigned'}
              </p>
            </Card>

            {/* Broker Commission */}
            <Card className="border-l-4 border-l-purple-500">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Broker
              </span>
              <p className="text-lg md:text-xl font-black text-purple-600 font-mono mt-1">
                {formatLKR(project.broker_commission ?? 0)}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {project.broker_name || 'No broker'}
              </p>
            </Card>

            {/* My Profit */}
            <Card className="border-l-4 border-l-emerald-500">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                My Profit
              </span>
              <p className={`text-lg md:text-xl font-black font-mono mt-1 ${
                (project.my_profit ?? project.net_profit) < 0 ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {formatLKR(project.my_profit ?? project.net_profit)}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Margin: {project.margin_pct}%</p>
            </Card>

            {/* Balance Due */}
            <Card className="border-l-4 border-l-amber-500">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Balance Due
              </span>
              <p className="text-lg md:text-xl font-black text-neutral-900 font-mono mt-1">
                {formatLKR(project.balance)}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Paid: {formatLKR(project.total_paid)}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer & Scope Info */}
            <Card>
              <h3 className="text-sm font-bold text-neutral-900 border-b border-border pb-3 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#FF8C00]" />
                Customer & Scope
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Client</span>
                  <p className="text-sm font-bold text-neutral-900">{project.customer_name}</p>
                  {project.customer_company && (
                    <p className="text-neutral-500 font-medium">{project.customer_company}</p>
                  )}
                </div>

                {project.customer_phone && (
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-bold">WhatsApp Contact</span>
                    <a
                      href={`https://wa.me/${project.customer_phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-emerald-600 hover:underline mt-0.5 font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {formatPhoneDisplay(project.customer_phone)}
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                )}

                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Kickoff Date</span>
                  <p className="text-neutral-800">{formatDate(project.project_date)}</p>
                </div>

                {project.notes && (
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-bold">Project Notes</span>
                    <p className="text-neutral-600 bg-surface-subtle p-2.5 rounded-lg border border-border mt-1">
                      {project.notes}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Income Payment History (Paid vs Balance) */}
            <Card>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Payments Received
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaymentModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Payment
                </Button>
              </div>

              {payments.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">
                  No installment payments recorded yet. Click "Add Payment" above.
                </p>
              ) : (
                <div className="space-y-2">
                  {payments.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-white"
                    >
                      <div>
                        <p className="text-xs font-bold text-neutral-800">
                          {p.note || 'Payment Received'}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {formatDate(p.payment_date)}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-600">
                        + {formatLKR(p.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex justify-between text-xs font-bold">
                    <span>Total Paid:</span>
                    <span className="font-mono text-emerald-700">{formatLKR(project.total_paid)}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES (Outcome) */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">
              Project Expense Timeline (Outcome)
            </h3>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
            >
              Add Expense
            </Button>
          </div>

          {/* Quick Add Row for this project */}
          <QuickAddExpenseRow defaultProjectId={project.id} />

          {/* Expense Table */}
          {expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-6 h-6" />}
              title="No expenses logged for this project"
              description="Use the quick add row above to log ad spend or service costs."
              actionLabel="Add First Expense"
              onAction={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
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
                            setEditingExpense(e);
                            setIsExpenseModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingExpense(e)}
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
        </div>
      )}

      {/* TAB 3: DOCUMENTS (Quotations & Invoices) */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">
              Project Invoices & Quotations
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => navigate(`/documents/new?type=quotation&project_id=${project.id}`)}
              >
                Create Quotation
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => navigate(`/documents/new?type=invoice&project_id=${project.id}`)}
              >
                Create Invoice
              </Button>
            </div>
          </div>

          {documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-6 h-6" />}
              title="No documents generated yet"
              description="Create an invoice or quotation from this project with 2-3 clicks."
              actionLabel="Create Invoice"
              onAction={() => navigate(`/documents/new?type=invoice&project_id=${project.id}`)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Document No.</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="capitalize text-xs font-bold text-neutral-700">
                      {d.type}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/documents/${d.id}`}
                        className="font-bold text-neutral-900 hover:text-[#FF8C00]"
                      >
                        {d.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-neutral-600">
                      {formatDate(d.issue_date)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">
                      {formatLKR(d.total)}
                    </TableCell>
                    <TableCell>{getStatusBadge(d.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/documents/${d.id}`)}
                      >
                        View / Send
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Partial Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />

      {/* Expense Form Modal */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        expenseToEdit={editingExpense}
        defaultProjectId={project.id}
      />

      {/* Delete Expense Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={() => deletingExpense && deleteExpenseMutation.mutate(deletingExpense.id)}
        title="Delete Expense"
        message="Are you sure you want to remove this expense record?"
        confirmText="Delete"
        isDestructive
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
};
