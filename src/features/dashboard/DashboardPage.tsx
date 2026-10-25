import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, FileText, TrendingUp, Receipt } from 'lucide-react';
import { formatLKR } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/Skeleton';

interface DashboardMetrics {
  totalProducts: number;
  totalInvoices: number;
  totalProfit: number;
  totalExpenses: number;
}

const STORAGE_KEY = 'codecrew_studio_rows_v2';

export const DashboardPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-core-metrics'],
    queryFn: async () => {
      let productsCount = 0;
      let invoicesCount = 0;
      let profitTotal = 0;
      let expensesTotal = 0;

      // 1. Check Supabase if configured
      if (isSupabaseConfigured) {
        try {
          // Fetch products/projects
          const { data: projects, error: projErr } = await supabase
            .from('projects')
            .select('id, name, price, outsourcer_cost, broker_commission, status');

          if (!projErr && projects) {
            productsCount += projects.length;
            projects.forEach(p => {
              const price = Number(p.price) || 0;
              const outsourcer = Number(p.outsourcer_cost) || 0;
              const broker = Number(p.broker_commission) || 0;
              profitTotal += price - (outsourcer + broker);
              expensesTotal += outsourcer + broker;
            });
          }

          // Fetch invoices
          const { count: invCount, error: invErr } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'invoice');

          if (!invErr && typeof invCount === 'number') {
            invoicesCount += invCount;
          }

          // Fetch recorded expenses
          const { data: expenses, error: expErr } = await supabase
            .from('expenses')
            .select('amount');

          if (!expErr && expenses) {
            expenses.forEach(e => {
              expensesTotal += Number(e.amount) || 0;
            });
          }
        } catch (err) {
          console.warn('Error fetching Supabase metrics:', err);
        }
      }

      // 2. Also check local studio rows (localStorage)
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const rows = Array.isArray(parsed) ? parsed : [parsed];
          rows.forEach((row: any) => {
            if (row && (row.projectName || row.clientCompany || row.invoiceNumber)) {
              // If not already counted from database
              if (!isSupabaseConfigured || productsCount === 0) {
                if (row.projectName) productsCount += 1;
                if (row.invoiceNumber) invoicesCount += 1;
                const myProfit = Number(row.myProfit) || 0;
                const brokerFee = Number(row.brokerFee) || 0;
                const outsourceFee = Number(row.outsourceWorkerFee) || 0;
                profitTotal += myProfit > 0 ? myProfit : (Number(row.total) || 0) - (brokerFee + outsourceFee);
                expensesTotal += brokerFee + outsourceFee;
              }
            }
          });
        }
      } catch (e) {
        console.warn('Error reading local storage metrics:', e);
      }

      return {
        totalProducts: productsCount,
        totalInvoices: invoicesCount,
        totalProfit: Math.max(0, profitTotal),
        totalExpenses: Math.max(0, expensesTotal),
      };
    },
  });

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-1">Overview of your business metrics</p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Products Created */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Products Created
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF8C00]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {metrics?.totalProducts || 0}
            </div>
          )}
          <p className="text-[11px] text-neutral-400 mt-1">Total recorded in system</p>
        </div>

        {/* 2. Total Invoices Created */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Invoices Created
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF8C00]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {metrics?.totalInvoices || 0}
            </div>
          )}
          <p className="text-[11px] text-neutral-400 mt-1">Total invoices generated</p>
        </div>

        {/* 3. Total Profit */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF8C00]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {formatLKR(metrics?.totalProfit || 0)}
            </div>
          )}
          <p className="text-[11px] text-neutral-400 mt-1">Net calculated earnings</p>
        </div>

        {/* 4. Total Expenses */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF8C00]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              {formatLKR(metrics?.totalExpenses || 0)}
            </div>
          )}
          <p className="text-[11px] text-neutral-400 mt-1">Total additions & expenses</p>
        </div>
      </div>
    </div>
  );
};
