import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Megaphone,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { useErpData } from '../../context/ErpDataContext';
import { formatLKR, formatDate } from '../../lib/formatters';
import { CampaignStatusBadge, OrderStatusBadge, CustomerPaymentBadge } from '../campaigns/components/Badges';

export const DashboardPage: React.FC = () => {
  const { orders, campaigns, expenses, exchangeRate, resetToDefaultSampleData } = useErpData();

  // 1. Calculate Ad Spend
  const totalAdSpendUsd = campaigns.reduce((sum, c) => sum + (Number(c.ad_spend_usd) || 0), 0);
  const totalAdSpendLkr = campaigns.reduce((sum, c) => {
    const usd = Number(c.ad_spend_usd) || 0;
    const lkr = Number(c.ad_spend_lkr) > 0 ? Number(c.ad_spend_lkr) : usd * exchangeRate;
    return sum + lkr;
  }, 0);

  // 2. Calculate Orders & Revenue & Supplier Costs
  let totalConfirmedCustomerPrice = 0;
  let totalSupplierCost = 0;
  let totalRealizedProfit = 0;

  orders.forEach(order => {
    let orderRevenue = 0;
    let orderSupplier = 0;

    (order.services || []).forEach(svc => {
      if (!svc.is_financial_pending && svc.client_price !== null && svc.supplier_cost !== null) {
        orderRevenue += Number(svc.client_price) || 0;
        orderSupplier += Number(svc.supplier_cost) || 0;
      }
    });

    totalConfirmedCustomerPrice += orderRevenue;
    totalSupplierCost += orderSupplier;

    // Realized profit calculation
    const custPaid = Number(order.customer_paid_amount) || 0;
    const suppPaid = Number(order.supplier_paid_amount) || 0;
    const cashRealized = custPaid - suppPaid;
    if (cashRealized > 0) {
      totalRealizedProfit += cashRealized;
    }
  });

  // 3. Expected Gross Profit
  const expectedProfit = totalConfirmedCustomerPrice - totalSupplierCost;

  // 4. Other Expenses
  const totalOtherExpensesLkr = expenses.reduce((sum, e) => {
    const amt = Number(e.amount_lkr || e.amount) || 0;
    return sum + amt;
  }, 0);

  // 5. Net Profit = Expected Profit - Total Ad Spend LKR - Other Expenses
  const netProfit = expectedProfit - totalAdSpendLkr - totalOtherExpensesLkr;

  return (
    <div className="h-full w-full bg-neutral-50/50 overflow-y-auto p-4 md:p-8 space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#FF8C00] flex items-center justify-center shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              Dashboard
            </h1>
            <p className="text-xs text-neutral-500">
              Business performance & financial overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToDefaultSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-2xs"
            title="Reset sample data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>

          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FF8C00] text-white hover:bg-[#E07B00] transition-colors shadow-2xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics - 4 Clean, Focused Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
            <ShoppingBag className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="font-mono font-bold text-xl md:text-2xl text-neutral-900 truncate">
            {formatLKR(totalConfirmedCustomerPrice)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">
            {orders.length} total orders
          </span>
        </div>

        {/* Supplier Costs */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Supplier Costs</span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="font-mono font-bold text-xl md:text-2xl text-neutral-700 truncate">
            {formatLKR(totalSupplierCost)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">
            Outsource fabrication
          </span>
        </div>

        {/* Ad Spend & Overhead */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ads & Overheads</span>
            <Megaphone className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="font-mono font-bold text-xl md:text-2xl text-neutral-700 truncate">
            {formatLKR(totalAdSpendLkr + totalOtherExpensesLkr)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">
            Marketing & operations
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
            <DollarSign className="w-4 h-4 text-[#FF8C00]" />
          </div>
          <div className="font-mono font-extrabold text-xl md:text-2xl text-emerald-600 truncate">
            {formatLKR(netProfit)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">
            Final bottom line
          </span>
        </div>
      </div>

      {/* 3. Orders Overview Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Recent Orders
            </h2>
          </div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF8C00] hover:text-[#E07B00]"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 text-[11px] font-semibold bg-neutral-50/60">
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Customer Price</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right font-bold">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map(order => {
                let rev = 0;
                let cost = 0;

                (order.services || []).forEach(s => {
                  if (!s.is_financial_pending && s.client_price !== null && s.supplier_cost !== null) {
                    rev += Number(s.client_price) || 0;
                    cost += Number(s.supplier_cost) || 0;
                  }
                });

                return (
                  <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-neutral-900">
                      <div>{order.order_name}</div>
                      <span className="text-[10px] text-neutral-400 font-mono">{order.order_number}</span>
                    </td>
                    <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                      {order.customer_name || 'Direct Client'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                      {formatLKR(rev)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-600 whitespace-nowrap">
                      {formatLKR(cost)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#FF8C00] whitespace-nowrap">
                      {formatLKR(rev - cost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Campaigns & Expenses Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campaigns Summary */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="text-xs font-bold text-neutral-800">
              Ad Campaigns ({campaigns.length})
            </h3>
            <Link to="/campaigns" className="text-xs font-semibold text-[#FF8C00] hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-2 text-xs">
            {campaigns.map(c => {
              const usd = Number(c.ad_spend_usd) || 0;
              const rate = Number(c.exchange_rate) || exchangeRate;
              const lkr = Number(c.ad_spend_lkr) > 0 ? Number(c.ad_spend_lkr) : usd * rate;

              return (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/80 border border-neutral-100">
                  <div className="truncate max-w-[240px]">
                    <span className="font-semibold text-neutral-900 block truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {formatDate(c.start_date)}
                    </span>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-mono font-bold text-neutral-900 text-xs block">
                      ${usd.toFixed(2)}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      {formatLKR(lkr)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses Summary */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="text-xs font-bold text-neutral-800">
              Recent Expenses ({expenses.length})
            </h3>
            <Link to="/expenses" className="text-xs font-semibold text-[#FF8C00] hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-2 text-xs">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/80 border border-neutral-100">
                <div className="truncate max-w-[240px]">
                  <span className="font-semibold text-neutral-800 block truncate">
                    {e.description}
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase">
                    {e.category}
                  </span>
                </div>
                <div className="font-mono font-bold text-neutral-900 text-xs whitespace-nowrap">
                  {formatLKR(e.amount_lkr || e.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
