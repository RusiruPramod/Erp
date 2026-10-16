import React, { useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Briefcase,
  FileText,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DateRangePicker, DateRange } from '../../components/ui/DateRangePicker';
import { Skeleton } from '../../components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { getStatusBadge } from '../../components/ui/Badge';
import { formatLKR, formatDate } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Link } from 'react-router-dom';

const MonthlyChart = lazy(() => import('./MonthlyChart'));

export const DashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // 1. Fetch KPIs via dashboard_kpis RPC
  const { data: kpis, isLoading: isKpisLoading } = useQuery({
    queryKey: ['dashboard-kpis', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return {
          total_income: 30000.0,
          total_expenses: 3500.0,
          net_profit: 26500.0,
          outstanding_balance: 15000.0,
          active_projects_count: 1,
        };
      }
      const { data, error } = await supabase.rpc('dashboard_kpis', {
        from_date: dateRange.startDate,
        to_date: dateRange.endDate,
      });
      if (error) throw error;
      return (
        data?.[0] || {
          total_income: 0,
          total_expenses: 0,
          net_profit: 0,
          outstanding_balance: 0,
          active_projects_count: 0,
        }
      );
    },
  });

  // 2. Fetch Monthly Chart Series via RPC
  const { data: series = [], isLoading: isSeriesLoading } = useQuery({
    queryKey: ['dashboard-series', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          { month_date: '2026-08-01', month_label: 'Aug 2026', income: 45000, expenses: 8000, profit: 37000 },
          { month_date: '2026-09-01', month_label: 'Sep 2026', income: 60000, expenses: 12000, profit: 48000 },
          { month_date: '2026-10-01', month_label: 'Oct 2026', income: 30000, expenses: 3500, profit: 26500 },
        ];
      }
      const { data, error } = await supabase.rpc('monthly_series', {
        from_date: dateRange.startDate,
        to_date: dateRange.endDate,
      });
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Fetch Top Projects by Profit
  const { data: topProjects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['dashboard-top-projects'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: '00000000-0000-0000-0000-000000000010',
            name: 'Google Workspace File Sync',
            customer_name: 'Shamshard Marikkar',
            income: 30000,
            total_expenses: 3500,
            net_profit: 26500,
            margin_pct: 88.33,
            status: 'active',
          },
        ];
      }
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .order('net_profit', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  // 4. Fetch Recent Expenses
  const { data: recentExpenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['dashboard-recent-expenses'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: '1',
            expense_date: new Date().toISOString(),
            description: 'Targeted Lead Ad Campaign - Facebook',
            type: 'advertisement',
            platform: 'Facebook',
            amount: 3500,
          },
        ];
      }
      const { data, error } = await supabase
        .from('expenses')
        .select('id, expense_date, description, type, platform, category, amount')
        .order('expense_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  // 5. Fetch Recent Documents
  const { data: recentDocs = [], isLoading: isDocsLoading } = useQuery({
    queryKey: ['dashboard-recent-docs'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: '1',
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
        .select('id, number, type, total, status, issue_date')
        .order('issue_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time project income, ad costs & profitability overview.
          </p>
        </div>

        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="border-l-4 border-l-[#FF8C00]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Total Income
            </span>
            <div className="rounded-lg bg-[#FFF4E6] p-2 text-[#FF8C00]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            {isKpisLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h3 className="text-xl md:text-2xl font-black text-neutral-900 font-mono">
                {formatLKR(kpis?.total_income)}
              </h3>
            )}
            <p className="text-[11px] text-neutral-400 mt-1">
              From projects in selected period
            </p>
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="border-l-4 border-l-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="rounded-lg bg-neutral-100 p-2 text-neutral-800">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            {isKpisLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h3 className="text-xl md:text-2xl font-black text-neutral-900 font-mono">
                {formatLKR(kpis?.total_expenses)}
              </h3>
            )}
            <p className="text-[11px] text-neutral-400 mt-1">
              Ad campaigns & operating costs
            </p>
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Net Profit
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            {isKpisLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h3 className="text-xl md:text-2xl font-black text-emerald-600 font-mono">
                {formatLKR(kpis?.net_profit)}
              </h3>
            )}
            <p className="text-[11px] text-neutral-400 mt-1">
              Income minus all expenses
            </p>
          </div>
        </Card>

        {/* Outstanding Balance */}
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Outstanding Balance
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            {isKpisLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <h3 className="text-xl md:text-2xl font-black text-neutral-900 font-mono">
                {formatLKR(kpis?.outstanding_balance)}
              </h3>
            )}
            <p className="text-[11px] text-neutral-400 mt-1">
              Unpaid client balances across active projects
            </p>
          </div>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Income vs Expenses
            </h2>
            <p className="text-xs text-neutral-400">
              Monthly cash flow comparison
            </p>
          </div>
        </div>

        <Suspense fallback={<Skeleton className="h-64 w-full mt-4" />}>
          {isSeriesLoading ? (
            <Skeleton className="h-64 w-full mt-4" />
          ) : (
            <MonthlyChart data={series} />
          )}
        </Suspense>
      </Card>

      {/* Bottom Grid: Top Projects & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Projects by Profit */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#FF8C00]" />
                Top Projects by Profit
              </h2>
              <p className="text-xs text-neutral-400">
                Highest earning deliverables
              </p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-semibold text-[#FF8C00] hover:underline inline-flex items-center gap-0.5"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isProjectsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : topProjects.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No projects recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProjects.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        to={`/projects/${p.id}`}
                        className="font-bold text-neutral-900 hover:text-[#FF8C00]"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-neutral-600">
                      {p.customer_name || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatLKR(p.income)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">
                      {formatLKR(p.net_profit)}
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Recent Documents & Expenses */}
        <div className="space-y-6">
          {/* Recent Documents */}
          <Card>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#FF8C00]" />
                Recent Documents
              </h2>
              <Link to="/documents" className="text-xs font-semibold text-[#FF8C00] hover:underline">
                View all
              </Link>
            </div>
            {isDocsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : recentDocs.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No documents generated yet.</p>
            ) : (
              <div className="space-y-2">
                {recentDocs.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle border border-border/70"
                  >
                    <div>
                      <p className="text-xs font-bold text-neutral-800">{doc.number}</p>
                      <p className="text-[10px] text-neutral-400 capitalize">
                        {doc.type} • {formatDate(doc.issue_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-neutral-900">
                        {formatLKR(doc.total)}
                      </p>
                      <div className="scale-90 origin-right">{getStatusBadge(doc.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Expenses */}
          <Card>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#FF8C00]" />
                Recent Expenses
              </h2>
              <Link to="/expenses" className="text-xs font-semibold text-[#FF8C00] hover:underline">
                View all
              </Link>
            </div>
            {isExpensesLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : recentExpenses.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No expenses recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {recentExpenses.map((exp: any) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle border border-border/70"
                  >
                    <div className="pr-2">
                      <p className="text-xs font-semibold text-neutral-800 line-clamp-1">
                        {exp.description}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {exp.platform || exp.category || 'General'} • {formatDate(exp.expense_date)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold text-neutral-900">
                        {formatLKR(exp.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
