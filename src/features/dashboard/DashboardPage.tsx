import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Megaphone,
  ShoppingBag,
  ArrowRight,
  Layers,
  RotateCcw,
  Receipt,
} from 'lucide-react';
import { useErpData } from '../../context/ErpDataContext';
import { formatLKR } from '../../lib/formatters';
import { OrderStatusBadge } from '../campaigns/components/Badges';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
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

  // Helper for non-bold, elegant tabular financial figures
  const renderMoney = (amount: number, highlightProfit = false) => {
    const str = formatLKR(amount);
    const [curr, val] = str.split(' ');
    return (
      <span className="tabular-nums inline-flex items-baseline justify-end gap-1">
        <span className="text-[11px] text-neutral-400 font-normal">{curr}</span>
        <span className={highlightProfit ? (amount >= 0 ? 'text-neutral-800 font-medium' : 'text-rose-600 font-medium') : 'text-neutral-700 font-normal'}>
          {val}
        </span>
      </span>
    );
  };

  const renderCardMoney = (amount: number, textColorClass = 'text-neutral-800') => {
    const str = formatLKR(amount);
    const [curr, val] = str.split(' ');
    return (
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-xs font-normal text-neutral-400">{curr}</span>
        <span className={`text-xl font-medium tracking-tight tabular-nums ${textColorClass}`}>
          {val}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-neutral-50/40 overflow-y-auto p-6 md:p-8 lg:p-10 space-y-8">
      {/* 1. Header with standard spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50/80 border border-orange-200/60 text-[#FF8C00] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              Dashboard
            </h1>
            <p className="text-xs text-neutral-500 font-normal mt-0.5">
              Business performance & financial overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetToDefaultSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-neutral-200/80 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-2xs"
            title="Reset sample data"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400 stroke-[1.75]" />
            <span>Reset Data</span>
          </button>

          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#FF8C00] text-white hover:bg-[#E07B00] transition-colors shadow-2xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Orders</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics - 5 Clean, Non-Bold Standard KPI Cards with Generous Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
        {/* 1. Net Profit */}
        <div className="bg-white border border-neutral-200/70 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Net Profit
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 stroke-[1.75]" />
              </div>
            </div>
            {renderCardMoney(netProfit, 'text-emerald-700')}
          </div>
          <span className="text-[11px] text-neutral-400 font-normal mt-3 block">
            Final bottom line
          </span>
        </div>

        {/* 2. Supplier Costs */}
        <div className="bg-white border border-neutral-200/70 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Supplier Costs
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100/80 text-neutral-500 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 stroke-[1.75]" />
              </div>
            </div>
            {renderCardMoney(totalSupplierCost, 'text-neutral-800')}
          </div>
          <span className="text-[11px] text-neutral-400 font-normal mt-3 block">
            Outsource fabrication
          </span>
        </div>

        {/* 3. Revenue */}
        <div className="bg-white border border-neutral-200/70 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Revenue
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100/80 text-neutral-500 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 stroke-[1.75]" />
              </div>
            </div>
            {renderCardMoney(totalConfirmedCustomerPrice, 'text-neutral-800')}
          </div>
          <span className="text-[11px] text-neutral-400 font-normal mt-3 block">
            {orders.length} total orders
          </span>
        </div>

        {/* 4. Ads */}
        <div className="bg-white border border-neutral-200/70 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Ads
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100/80 text-neutral-500 flex items-center justify-center">
                <Megaphone className="w-3.5 h-3.5 stroke-[1.75]" />
              </div>
            </div>
            {renderCardMoney(totalAdSpendLkr, 'text-neutral-800')}
          </div>
          <span className="text-[11px] text-neutral-400 font-normal mt-3 block">
            ${totalAdSpendUsd.toFixed(2)} USD spend
          </span>
        </div>

        {/* 5. Overheads */}
        <div className="bg-white border border-neutral-200/70 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-neutral-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Overheads
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100/80 text-neutral-500 flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5 stroke-[1.75]" />
              </div>
            </div>
            {renderCardMoney(totalOtherExpensesLkr, 'text-neutral-800')}
          </div>
          <span className="text-[11px] text-neutral-400 font-normal mt-3 block">
            {expenses.length} expense items
          </span>
        </div>
      </div>

      {/* 3. Recent Orders Table - Standard, Elegant, Clean Spacing */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Table Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-medium text-neutral-900">
              Recent Orders
            </h2>
            <span className="text-[11px] font-normal text-neutral-500 bg-neutral-100/80 px-2 py-0.5 rounded-md">
              {orders.length}
            </span>
          </div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-xs font-normal text-neutral-500 hover:text-[#FF8C00] transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" />
          </Link>
        </div>

        {/* Table Content */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-6 text-left font-medium">Project</th>
                <th className="py-3 px-6 text-left font-medium">Customer</th>
                <th className="py-3 px-6 text-left font-medium">Status</th>
                <th className="py-3 px-6 text-right font-medium">Customer Price</th>
                <th className="py-3 px-6 text-right font-medium">Cost</th>
                <th className="py-3 px-6 text-right font-medium">Profit</th>
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
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="hover:bg-neutral-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div className="text-xs font-medium text-neutral-800 hover:text-[#FF8C00] transition-colors">
                        {order.order_name}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-normal mt-0.5">
                        {order.order_number}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-neutral-600 font-normal whitespace-nowrap">
                      {order.customer_name || 'Direct Client'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-4 px-6 text-right text-xs whitespace-nowrap">
                      {renderMoney(rev)}
                    </td>
                    <td className="py-4 px-6 text-right text-xs whitespace-nowrap">
                      {renderMoney(cost)}
                    </td>
                    <td className="py-4 px-6 text-right text-xs whitespace-nowrap">
                      {renderMoney(rev - cost, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
