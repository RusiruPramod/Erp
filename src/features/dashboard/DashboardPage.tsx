import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, FileText, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/Skeleton';

interface DashboardMetrics {
  totalProducts: number;
  totalInvoices: number;
  totalAmount: number;
  internalDistribution: number;
  myIncome: number;
}

const STORAGE_KEY = 'codecrew_studio_rows_v2';

function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const DashboardPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-core-metrics'],
    queryFn: async () => {
      let productsCount = 0;
      let invoicesCount = 0;
      let amountTotal = 0;
      let distributionTotal = 0;

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
              amountTotal += price;
              distributionTotal += (outsourcer + broker);
            });
          }

          // Fetch invoices
          const { data: docs, error: invErr } = await supabase
            .from('documents')
            .select('id, total')
            .eq('type', 'invoice');

          if (!invErr && docs) {
            invoicesCount += docs.length;
            if (productsCount === 0) {
              docs.forEach(d => {
                amountTotal += Number(d.total) || 0;
              });
            }
          }

          // Fetch recorded expenses
          const { data: expenses, error: expErr } = await supabase
            .from('expenses')
            .select('amount');

          if (!expErr && expenses) {
            expenses.forEach(e => {
              distributionTotal += Number(e.amount) || 0;
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
            // Clean up legacy sample project if present in localStorage
            if (row?.projectName === 'Google Workspace File Sync' && row?.clientCompany === 'InterMax (Pvt) Ltd.') {
              localStorage.removeItem(STORAGE_KEY);
              return;
            }
            if (row && (row.projectName || row.clientCompany || row.invoiceNumber)) {
              if (!isSupabaseConfigured || productsCount === 0) {
                if (row.projectName) productsCount += 1;
                if (row.invoiceNumber) invoicesCount += 1;
                const tot = Number(row.total) || 0;
                const broker = Number(row.brokerFee) || 0;
                const outsource = Number(row.outsourceWorkerFee) || 0;
                amountTotal += tot;
                distributionTotal += (broker + outsource);
              }
            }
          });
        }
      } catch (e) {
        console.warn('Error reading local storage metrics:', e);
      }

      // My income (my profit) = Total amount - Internal Distribution
      const myIncomeTotal = Math.max(0, amountTotal - distributionTotal);

      return {
        totalProducts: productsCount,
        totalInvoices: invoicesCount,
        totalAmount: Math.max(0, amountTotal),
        internalDistribution: Math.max(0, distributionTotal),
        myIncome: myIncomeTotal,
      };
    },
  });

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-1">Overview of your business metrics</p>
      </div>

      {/* Compact Cards Grid with generous gap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-5">
        {/* 1. My Income (My Profit) - Hero first card */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs hover:border-neutral-300 transition-all min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider truncate">
                My Income (My Profit)
              </span>
              <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="text-[10px] font-semibold text-neutral-400 font-sans shrink-0">LKR</span>
                <span
                  className="text-[17px] font-bold text-neutral-900 font-mono tracking-tight truncate"
                  title={`LKR ${formatNumber(metrics?.myIncome || 0)}`}
                >
                  {formatNumber(metrics?.myIncome || 0)}
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 truncate">
            Total Amount − Internal Distribution
          </p>
        </div>

        {/* 2. Total Amount */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs hover:border-neutral-300 transition-all min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider truncate">
                Total Amount
              </span>
              <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="text-[10px] font-semibold text-neutral-400 font-sans shrink-0">LKR</span>
                <span
                  className="text-[17px] font-bold text-neutral-900 font-mono tracking-tight truncate"
                  title={`LKR ${formatNumber(metrics?.totalAmount || 0)}`}
                >
                  {formatNumber(metrics?.totalAmount || 0)}
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 truncate">Total gross revenue</p>
        </div>

        {/* 3. Internal Distribution */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs hover:border-neutral-300 transition-all min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider truncate">
                Internal Distribution
              </span>
              <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="text-[10px] font-semibold text-neutral-400 font-sans shrink-0">LKR</span>
                <span
                  className="text-[17px] font-bold text-neutral-900 font-mono tracking-tight truncate"
                  title={`LKR ${formatNumber(metrics?.internalDistribution || 0)}`}
                >
                  {formatNumber(metrics?.internalDistribution || 0)}
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 truncate">Broker & outsource costs</p>
        </div>

        {/* 4. Total Invoices Created */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs hover:border-neutral-300 transition-all min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider truncate">
                Total Invoices
              </span>
              <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-xl font-bold text-neutral-900 font-mono tracking-tight">
                {metrics?.totalInvoices || 0}
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 truncate">Invoices generated</p>
        </div>

        {/* 5. Total Products Created */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs hover:border-neutral-300 transition-all min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider truncate">
                Total Products
              </span>
              <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="text-xl font-bold text-neutral-900 font-mono tracking-tight">
                {metrics?.totalProducts || 0}
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 truncate">Recorded in system</p>
        </div>
      </div>
    </div>
  );
};
