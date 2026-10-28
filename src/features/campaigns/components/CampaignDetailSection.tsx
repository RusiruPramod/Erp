import React from 'react';
import {
  AdCampaign,
  AdCampaignOrder,
  AdCampaignExpense,
} from '../../../types';
import {
  calculateOrderFinancials,
  calculateCampaignFinancials,
} from '../../../services/adCalculations';
import { formatLKR, formatDate } from '../../../lib/formatters';
import { CampaignStatusBadge, OrderStatusBadge, IncompleteFinancialBadge } from './Badges';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Layers,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface CampaignDetailSectionProps {
  campaign: AdCampaign;
  orders: AdCampaignOrder[];
  expenses: AdCampaignExpense[];
  onAddOrder: (campaignId: string) => void;
  onEditOrder: (order: AdCampaignOrder) => void;
  onDeleteOrder: (order: AdCampaignOrder) => void;
  onConfirmOrder: (orderId: string) => void;
  onAddExpense: (campaignId: string) => void;
  onDeleteExpense: (expense: AdCampaignExpense) => void;
  onOpenCloseModal: (campaign: AdCampaign) => void;
  onEditCampaign: (campaign: AdCampaign) => void;
}

export const CampaignDetailSection: React.FC<CampaignDetailSectionProps> = ({
  campaign,
  orders,
  expenses,
  onAddOrder,
  onEditOrder,
  onDeleteOrder,
  onConfirmOrder,
  onAddExpense,
  onDeleteExpense,
  onOpenCloseModal,
  onEditCampaign,
}) => {
  const campaignOrders = orders.filter(o => o.campaign_id === campaign.id);
  const campaignExpenses = expenses.filter(e => e.campaign_id === campaign.id);

  // Financial summary for this specific campaign
  const summary = calculateCampaignFinancials(campaign, orders, expenses);

  return (
    <div className="bg-neutral-50/70 border-t border-b border-neutral-200 p-4 md:p-6 space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 text-white">
              {campaign.campaign_code}
            </span>
            <h3 className="text-base font-bold text-neutral-900">{campaign.name}</h3>
            <CampaignStatusBadge status={campaign.status} size="sm" />
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1.5 flex-wrap">
            <span>
              Period: <strong className="text-neutral-700">{formatDate(campaign.start_date)}</strong>
              {campaign.end_date ? ` — ${formatDate(campaign.end_date)}` : ' (Currently Running)'}
            </span>
            {campaign.fb_campaign_ref && (
              <>
                <span>•</span>
                <span>
                  Meta Ref: <code className="text-neutral-700 font-mono">{campaign.fb_campaign_ref}</code>
                </span>
              </>
            )}
            <span>•</span>
            <span>
              Ad Spend: <strong className="text-neutral-900">${summary.ad_spend_usd.toFixed(2)} USD</strong> (≈ {formatLKR(summary.ad_spend_lkr)})
            </span>
          </div>

          {campaign.notes && (
            <p className="text-xs text-neutral-600 mt-2 italic bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200/60 max-w-2xl">
              "{campaign.notes}"
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => onEditCampaign(campaign)}
          >
            Edit Campaign
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Receipt className="w-3.5 h-3.5" />}
            onClick={() => onAddExpense(campaign.id)}
          >
            + Add Expense
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddOrder(campaign.id)}
          >
            + Add Order
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => onOpenCloseModal(campaign)}
          >
            {campaign.status === 'closed' ? 'Adjust / Review' : 'Close / Review'}
          </Button>
        </div>
      </div>

      {/* 2. Compact Financial Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block truncate">
            Confirmed Orders
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold font-mono text-neutral-900">
              {summary.confirmed_orders_count}
            </span>
            {summary.pending_orders_count > 0 && (
              <span className="text-[11px] font-medium text-amber-600">
                (+{summary.pending_orders_count} pending)
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block truncate">
            Confirmed Revenue
          </span>
          <p className="text-sm font-bold font-mono text-neutral-900 mt-1 truncate">
            {formatLKR(summary.total_revenue)}
          </p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block truncate">
            Supplier Costs
          </span>
          <p className="text-sm font-bold font-mono text-neutral-700 mt-1 truncate">
            {formatLKR(summary.total_supplier_costs)}
          </p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block truncate">
            Gross Profit
          </span>
          <p className="text-sm font-bold font-mono text-[#FF8C00] mt-1 truncate">
            {formatLKR(summary.gross_profit)}
          </p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block truncate">
            Ads & Other Costs
          </span>
          <p className="text-sm font-bold font-mono text-red-600 mt-1 truncate">
            {formatLKR(summary.ad_spend_lkr + summary.other_expenses_lkr)}
          </p>
          <span className="text-[10px] text-neutral-400 block truncate">
            Ads: {formatLKR(summary.ad_spend_lkr)}
          </span>
        </div>

        <div
          className={`p-3 rounded-xl border shadow-xs ${
            summary.net_profit >= 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block truncate">
            Net Profit
          </span>
          <p
            className={`text-sm font-extrabold font-mono mt-1 truncate ${
              summary.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatLKR(summary.net_profit)}
          </p>
        </div>
      </div>

      {summary.has_incomplete_financials && (
        <div className="flex items-center gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <div>
            <strong className="font-semibold">Incomplete Financial Records Exist:</strong> One or more
            orders have pending service supplier costs or prices. Incomplete services are excluded from
            finalized totals until updated.
          </div>
        </div>
      )}

      {/* 3. Orders Breakdown Table (Section 11 & 12 Allocation Table) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#FF8C00]" /> Orders & Advertising Allocation
            </h4>
            <p className="text-[11px] text-neutral-500">
              Order Advertising Allocation = Campaign Ad Spend × (Order Revenue ÷ Total Eligible Campaign Revenue)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddOrder(campaign.id)}
          >
            Add Order to Campaign
          </Button>
        </div>

        {campaignOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-neutral-700">No orders recorded for this campaign yet</p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              As customer inquiries arrive or orders are confirmed, click + Add Order to track services, supplier costs, and markup.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onAddOrder(campaign.id)}
            >
              Record First Order
            </Button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-neutral-700 font-bold uppercase border-b border-neutral-200 text-[11px]">
                  <th className="px-3 py-2.5">Order / Project</th>
                  <th className="px-3 py-2.5">Customer & Date</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Services Details</th>
                  <th className="px-3 py-2.5 text-right">Revenue</th>
                  <th className="px-3 py-2.5 text-right">Supplier Costs</th>
                  <th className="px-3 py-2.5 text-right">Gross Profit</th>
                  <th className="px-3 py-2.5 text-right">Allocated Ad Cost</th>
                  <th className="px-3 py-2.5 text-right font-extrabold">Net Contribution</th>
                  <th className="px-3 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {campaignOrders.map(order => {
                  const fin = calculateOrderFinancials(
                    order,
                    summary.total_revenue,
                    summary.ad_spend_lkr
                  );

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-neutral-50 transition-colors ${
                        order.status === 'pending'
                          ? 'bg-amber-50/20'
                          : fin.has_incomplete_financials
                          ? 'bg-rose-50/20'
                          : ''
                      }`}
                    >
                      {/* Order Name & ID */}
                      <td className="px-3 py-3 align-top">
                        <div className="font-semibold text-neutral-900 text-xs">
                          {order.order_name}
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500">
                          {order.order_number}
                        </span>
                        {fin.has_incomplete_financials && (
                          <div className="mt-1">
                            <IncompleteFinancialBadge size="sm" />
                          </div>
                        )}
                      </td>

                      {/* Customer & Date */}
                      <td className="px-3 py-3 align-top whitespace-nowrap text-neutral-600">
                        <div className="font-medium text-neutral-800">
                          {order.customer_name || 'Direct / Anonymous'}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {formatDate(order.order_date)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <OrderStatusBadge status={order.status} size="sm" />
                        {order.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => onConfirmOrder(order.id)}
                            className="block mt-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 underline"
                          >
                            Mark Confirmed
                          </button>
                        )}
                      </td>

                      {/* Services Details */}
                      <td className="px-3 py-3 align-top">
                        <div className="space-y-1 min-w-[200px]">
                          {(order.services || []).map(svc => (
                            <div
                              key={svc.id}
                              className="text-[11px] flex items-center justify-between border-b border-neutral-100 pb-0.5"
                            >
                              <span className="text-neutral-700 truncate max-w-[120px]">
                                • {svc.service_name}
                                <span className="text-[9px] text-neutral-400 ml-1">
                                  ({svc.supplier_type === 'in_house' ? 'In-house' : 'Outsourced'})
                                </span>
                              </span>
                              {svc.is_financial_pending ? (
                                <span className="text-[10px] text-amber-600 font-medium">Pending quote</span>
                              ) : (
                                <span className="font-mono text-[10px] text-neutral-600">
                                  Cost: {formatLKR(svc.supplier_cost)} | Price: {formatLKR(svc.client_price)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Financial Numbers */}
                      <td className="px-3 py-3 align-top text-right font-mono font-medium text-neutral-900 whitespace-nowrap">
                        {order.status === 'pending' ? (
                          <span className="text-neutral-400" title="Pending inquiry (not confirmed)">
                            ({formatLKR(fin.revenue)})
                          </span>
                        ) : (
                          formatLKR(fin.revenue)
                        )}
                      </td>

                      <td className="px-3 py-3 align-top text-right font-mono text-neutral-600 whitespace-nowrap">
                        {order.status === 'pending' ? (
                          <span className="text-neutral-400">({formatLKR(fin.supplier_costs)})</span>
                        ) : (
                          formatLKR(fin.supplier_costs)
                        )}
                      </td>

                      <td className="px-3 py-3 align-top text-right font-mono font-semibold text-neutral-900 whitespace-nowrap">
                        {order.status === 'pending' ? (
                          <span className="text-neutral-400">({formatLKR(fin.gross_profit)})</span>
                        ) : (
                          formatLKR(fin.gross_profit)
                        )}
                      </td>

                      {/* Allocated Ad Spend */}
                      <td className="px-3 py-3 align-top text-right font-mono text-neutral-600 whitespace-nowrap">
                        {order.status === 'pending' ? (
                          <span className="text-neutral-400">-</span>
                        ) : fin.allocated_ad_spend > 0 ? (
                          <span className="text-red-600">− {formatLKR(fin.allocated_ad_spend)}</span>
                        ) : (
                          <span className="text-neutral-400">LKR 0.00</span>
                        )}
                      </td>

                      {/* Net Contribution */}
                      <td className="px-3 py-3 align-top text-right font-mono font-bold whitespace-nowrap">
                        {order.status === 'pending' ? (
                          <span className="text-neutral-400 font-normal">Pending</span>
                        ) : (
                          <span
                            className={
                              fin.net_contribution >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }
                          >
                            {formatLKR(fin.net_contribution)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditOrder(order)}
                            className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                            title="Edit Order"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(order)}
                            className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-neutral-100"
                            title="Delete Order"
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
        )}
      </div>

      {/* 4. Additional Campaign Operational Expenses Breakdown */}
      {campaignExpenses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-neutral-600" /> Operational Expenses for this Campaign
            </h4>
            <span className="text-xs font-semibold text-neutral-600">
              Total: {formatLKR(summary.other_expenses_lkr)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {campaignExpenses.map(exp => (
              <div
                key={exp.id}
                className="bg-white p-2.5 rounded-lg border border-neutral-200 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase">
                    [{exp.category}] • {formatDate(exp.expense_date)}
                  </span>
                  <p className="text-xs font-medium text-neutral-800 truncate max-w-[180px]">
                    {exp.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-neutral-900">
                    {formatLKR(Number(exp.amount_lkr || exp.amount))}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteExpense(exp)}
                    className="text-neutral-400 hover:text-red-600 p-0.5"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
