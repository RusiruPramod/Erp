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
      {/* 1. Header with Reset & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#FF8C00] flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                ERP Business Ledger Dashboard
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Overview of ad spend, customer orders, supplier outsource costs, and net profit.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={resetToDefaultSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs"
            title="Reset to default sample data"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
            <span>Reset Sample Data</span>
          </button>

          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#FF8C00] text-white hover:bg-[#E07B00] transition-colors shadow-2xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Orders</span>
          </Link>
        </div>
      </div>

      {/* 2. The 6 Main Required Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Ad Spend */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Ad Spend
              </span>
              <Megaphone className="w-3.5 h-3.5 text-[#FF8C00]" />
            </div>
            <div className="font-mono font-bold text-lg text-neutral-900">
              ${totalAdSpendUsd.toFixed(2)} <span className="text-xs text-neutral-500 font-normal">USD</span>
            </div>
            <div className="text-xs font-mono font-semibold text-[#FF8C00] mt-0.5">
              ≈ {formatLKR(totalAdSpendLkr)}
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 border-t border-neutral-100 pt-1.5">
            Hist $10.24 + Current $3.11
          </p>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Total Orders
              </span>
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-2xl text-neutral-900">{orders.length}</span>
              <span className="text-xs text-neutral-500">projects</span>
            </div>
            <div className="text-xs font-mono font-semibold text-neutral-700 mt-0.5 truncate">
              {formatLKR(totalConfirmedCustomerPrice)}
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 border-t border-neutral-100 pt-1.5">
            Confirmed customer price
          </p>
        </div>

        {/* Card 3: Supplier Cost */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Supplier Cost
              </span>
              <Layers className="w-3.5 h-3.5 text-neutral-600" />
            </div>
            <div className="font-mono font-bold text-lg text-neutral-800 truncate">
              {formatLKR(totalSupplierCost)}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Outsource & printing
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 border-t border-neutral-100 pt-1.5">
            PCB design & print costs
          </p>
        </div>

        {/* Card 4: Expected Profit */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Expected Profit
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="font-mono font-bold text-lg text-emerald-700 truncate">
              {formatLKR(expectedProfit)}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Gross Order Margin
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 border-t border-neutral-100 pt-1.5">
            Customer Price − Cost
          </p>
        </div>

        {/* Card 5: Realized Profit */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Realized Profit
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="font-mono font-bold text-lg text-emerald-800 truncate">
              {formatLKR(totalRealizedProfit)}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Collected Payments
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 border-t border-neutral-100 pt-1.5">
            Cash collected − Paid
          </p>
        </div>

        {/* Card 6: Net Profit */}
        <div className="bg-neutral-900 border border-neutral-800 text-white rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Net Profit
              </span>
              <DollarSign className="w-3.5 h-3.5 text-[#FF8C00]" />
            </div>
            <div className="font-mono font-extrabold text-lg text-emerald-400 truncate">
              {formatLKR(netProfit)}
            </div>
            <div className="text-[11px] text-neutral-300 mt-0.5">
              Bottom Line Return
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 border-t border-neutral-800 pt-1.5">
            Expected Profit − Ads − Expenses
          </p>
        </div>
      </div>

      {/* 3. Sample Orders Preview Section */}
      <div className="bg-white rounded-xl border border-neutral-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#FF8C00]" />
              Sample Orders Summary
            </h2>
            <p className="text-xs text-neutral-500">
              Customer Price, Supplier Cost, and Profit Breakdown for 3 Core Sample Projects
            </p>
          </div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF8C00] hover:text-[#E07B00]"
          >
            <span>Manage Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 text-[10px] uppercase font-bold bg-neutral-50/60">
                <th className="py-2.5 px-3">Project Name</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Order Status</th>
                <th className="py-2.5 px-3">Payment Status</th>
                <th className="py-2.5 px-3 text-right font-bold">Customer Price</th>
                <th className="py-2.5 px-3 text-right">Supplier Cost</th>
                <th className="py-2.5 px-3 text-right font-bold">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map(order => {
                let rev = 0;
                let cost = 0;
                let isPending = false;

                (order.services || []).forEach(s => {
                  if (s.is_financial_pending || s.client_price === null || s.supplier_cost === null) {
                    isPending = true;
                  } else {
                    rev += Number(s.client_price) || 0;
                    cost += Number(s.supplier_cost) || 0;
                  }
                });

                return (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-neutral-900">
                      <div>{order.order_name}</div>
                      <span className="text-[10px] text-neutral-400 font-mono">{order.order_number}</span>
                    </td>
                    <td className="py-3 px-3 text-neutral-700 whitespace-nowrap">
                      {order.customer_name || 'Direct Client'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <CustomerPaymentBadge status={order.payment_status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                      {isPending ? (
                        <span className="text-amber-700 font-semibold">{formatLKR(rev)}*</span>
                      ) : (
                        formatLKR(rev)
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-600 whitespace-nowrap">
                      {isPending ? (
                        <span className="text-amber-700">{formatLKR(cost)}*</span>
                      ) : (
                        formatLKR(cost)
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-[#FF8C00] whitespace-nowrap">
                      {isPending ? (
                        <span className="text-amber-700 font-semibold">{formatLKR(rev - cost)}*</span>
                      ) : (
                        formatLKR(rev - cost)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-neutral-400 italic">
          * Safety Panel: Confirmed Customer Price Rs. 8,000, Confirmed Supplier Cost Rs. 4,000, Confirmed Profit Rs. 4,000. Print PCB cost and final price are Pending.
        </p>
      </div>

      {/* 4. Campaigns & Expenses Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campaigns Summary Card */}
        <div className="bg-white rounded-xl border border-neutral-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-[#FF8C00]" /> 3 Ad Campaigns
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
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/60">
                  <div>
                    <span className="font-semibold text-neutral-900 block truncate max-w-[220px]">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {c.campaign_code} • {formatDate(c.start_date)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-neutral-900 block">
                      ${usd.toFixed(2)} USD
                    </span>
                    <span className="font-mono text-[10px] text-[#FF8C00]">
                      {formatLKR(lkr)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses Summary Card */}
        <div className="bg-white rounded-xl border border-neutral-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-neutral-600" /> Operational Expenses
            </h3>
            <Link to="/expenses" className="text-xs font-semibold text-[#FF8C00] hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-2 text-xs">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/60">
                <div>
                  <span className="font-semibold text-neutral-800 block truncate max-w-[220px]">
                    {e.description}
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase">
                    [{e.category}] • {formatDate(e.expense_date)}
                  </span>
                </div>
                <div className="font-mono font-bold text-neutral-900">
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
