import React, { useState } from 'react';
import {
  AdCampaign,
  AdCampaignExpense,
  AdCampaignOrder,
} from '../../../types';
import { formatLKR, formatDate } from '../../../lib/formatters';
import { CampaignStatusBadge, OrderStatusBadge, CustomerPaymentBadge } from './Badges';
import {
  calculateOrderFinancials,
  computeOrderAdAllocations,
} from '../../../services/adCalculations';
import {
  Edit2,
  Trash2,
  CheckCircle2,
  Receipt,
  Plus,
  DollarSign,
  Calendar,
  Globe,
  FileText,
  ShoppingBag,
  History,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface CampaignDetailSectionProps {
  campaign: AdCampaign;
  orders?: AdCampaignOrder[];
  expenses: AdCampaignExpense[];
  onAddExpense: (campaignId: string) => void;
  onDeleteExpense: (expense: AdCampaignExpense) => void;
  onOpenCloseModal: (campaign: AdCampaign) => void;
  onEditCampaign: (campaign: AdCampaign) => void;
}

export const CampaignDetailSection: React.FC<CampaignDetailSectionProps> = ({
  campaign,
  orders = [],
  expenses,
  onAddExpense,
  onDeleteExpense,
  onOpenCloseModal,
  onEditCampaign,
}) => {
  const [showHistoricalTransactions, setShowHistoricalTransactions] = useState(true);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const campaignExpenses = expenses.filter(e => e.campaign_id === campaign.id);
  const totalOtherExpenses = campaignExpenses.reduce(
    (sum, e) => sum + (Number(e.amount_lkr) || Number(e.amount) || 0),
    0
  );

  const adSpendUsd = Number(campaign.ad_spend_usd) || 0;
  const exchangeRate = Number(campaign.exchange_rate) || 305;
  const adSpendLkr =
    Number(campaign.ad_spend_lkr) > 0
      ? Number(campaign.ad_spend_lkr)
      : Math.round(adSpendUsd * exchangeRate * 100) / 100;

  const totalCostLkr = adSpendLkr + totalOtherExpenses;

  // Linked orders
  const campaignOrders = orders.filter(o => o.campaign_id === campaign.id);
  const allocationMethod = campaign.allocation_method || 'revenue_based';
  const allocationMap = computeOrderAdAllocations(campaignOrders, adSpendLkr, allocationMethod);

  return (
    <div className="bg-neutral-50/70 border-t border-b border-neutral-200 p-4 md:p-6 space-y-5">
      {/* 1. Ad Campaign Details Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 text-white">
              {campaign.campaign_code}
            </span>
            <h3 className="text-base font-bold text-neutral-900">{campaign.name}</h3>
            <CampaignStatusBadge status={campaign.status} size="sm" />
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
              Platform: {campaign.platform || 'Facebook'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              Period: <strong className="text-neutral-700">{formatDate(campaign.start_date)}</strong>
              {campaign.end_date ? ` — ${formatDate(campaign.end_date)}` : ' (Active Running)'}
            </span>
            {campaign.fb_campaign_ref && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  Meta Ref: <code className="text-neutral-700 font-mono font-semibold">{campaign.fb_campaign_ref}</code>
                </span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#FF8C00]" />
              Rate: <strong className="text-neutral-700">{exchangeRate.toFixed(2)} LKR/USD</strong>
            </span>
            <span>•</span>
            <span className="text-[11px] text-neutral-600">
              Allocation: <strong className="capitalize">{allocationMethod.replace('_', ' ')}</strong>
            </span>
          </div>

          {campaign.notes && (
            <div className="mt-2.5 flex items-start gap-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/60 max-w-2xl">
              <FileText className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>{campaign.notes}</span>
            </div>
          )}
        </div>

        {/* Actions */}
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
            variant="primary"
            size="sm"
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => onOpenCloseModal(campaign)}
          >
            {campaign.status === 'closed' ? 'Adjust / Settle Spend' : 'Close / Settle Spend'}
          </Button>
        </div>
      </div>

      {/* 2. Ad Expenditure Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Meta Ad Spend (USD)
          </span>
          <div className="text-lg font-bold font-mono text-neutral-900 mt-1">
            ${adSpendUsd.toFixed(2)} USD
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Billed by Facebook Meta Ads</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Converted Spend (LKR)
          </span>
          <div className="text-lg font-bold font-mono text-[#FF8C00] mt-1">
            {formatLKR(adSpendLkr)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">At {exchangeRate.toFixed(2)} LKR/USD</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Total Campaign Expenses
          </span>
          <div className="text-lg font-bold font-mono text-neutral-900 mt-1">
            {formatLKR(totalCostLkr)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Ad spend + {formatLKR(totalOtherExpenses)} other expenses
          </p>
        </div>
      </div>

      {/* 3. Historical Individual Transactions (if present on this campaign) */}
      {campaign.historical_entries && campaign.historical_entries.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3 shadow-2xs">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowHistoricalTransactions(!showHistoricalTransactions)}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#FF8C00]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Consolidated Historical Transactions ({campaign.historical_entries.length} Entries = ${adSpendUsd.toFixed(2)} USD)
              </h4>
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <span>{showHistoricalTransactions ? 'Hide Details' : 'Expand Transactions'}</span>
              {showHistoricalTransactions ? (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </div>

          {showHistoricalTransactions && (
            <div className="w-full overflow-x-auto rounded-lg border border-neutral-100 animate-in fade-in">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 text-[10px] uppercase font-bold border-b border-neutral-200">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Description / Note</th>
                    <th className="py-2 px-3 text-right">Ad Spend (USD)</th>
                    <th className="py-2 px-3 text-right">Equivalent (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {campaign.historical_entries.map(entry => (
                    <tr key={entry.id} className="hover:bg-neutral-50/50">
                      <td className="py-2 px-3 whitespace-nowrap text-neutral-600">
                        {formatDate(entry.date)}
                      </td>
                      <td className="py-2 px-3 font-medium text-neutral-800">
                        {entry.note || 'Meta Ads historical billing'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900">
                        ${entry.amount_usd.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-[#FF8C00]">
                        {formatLKR(entry.amount_lkr)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-50 font-bold border-t border-neutral-200">
                    <td colSpan={2} className="py-2 px-3 uppercase text-[10px] text-neutral-600">
                      Total Historical Spend
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-900">
                      ${campaign.historical_entries.reduce((s, e) => s + e.amount_usd, 0).toFixed(2)} USD
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[#FF8C00]">
                      {formatLKR(campaign.historical_entries.reduce((s, e) => s + e.amount_lkr, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Campaign-Linked Orders (Automatically surfaced from Orders store) */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#FF8C00]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Orders Received From This Campaign ({campaignOrders.length})
            </h4>
          </div>
          <span className="text-[11px] text-neutral-400">
            Automatically synchronized with Orders page
          </span>
        </div>

        {campaignOrders.length === 0 ? (
          <div className="p-3 bg-neutral-50 rounded-lg text-center text-xs text-neutral-400">
            No orders linked to this campaign yet. Ad spend is currently unallocated.
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-neutral-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-[10px] uppercase font-bold border-b border-neutral-200">
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Project Title</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Customer Price</th>
                  <th className="py-2 px-3 text-right">Supplier Cost</th>
                  <th className="py-2 px-3 text-right font-bold">Gross Profit</th>
                  <th className="py-2 px-3 text-right font-bold">Allocated Ad Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {campaignOrders.map(order => {
                  const allocShare = allocationMap.get(order.id) || 0;
                  const fin = calculateOrderFinancials(order, 0, 0, allocShare);

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/60">
                      <td className="py-2 px-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {order.order_number}
                      </td>
                      <td className="py-2 px-3 font-medium text-neutral-900">
                        {order.order_name}
                      </td>
                      <td className="py-2 px-3 text-neutral-600 whitespace-nowrap">
                        {order.customer_name || 'Direct'}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <OrderStatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {fin.has_incomplete_financials ? (
                          <span className="text-amber-600 font-medium">Pending Quote</span>
                        ) : (
                          formatLKR(fin.revenue)
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-neutral-600 whitespace-nowrap">
                        {fin.has_incomplete_financials ? '-' : formatLKR(fin.supplier_costs)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#FF8C00] whitespace-nowrap">
                        {fin.has_incomplete_financials ? 'Pending' : formatLKR(fin.gross_profit)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatLKR(allocShare)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Operational Expenses (Packaging, Courier, etc.) */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-neutral-600" /> Additional Campaign Operational Expenses
            </h4>
            <p className="text-[11px] text-neutral-500">
              Packaging boxes, delivery courier fees, materials, and reloads for this campaign
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddExpense(campaign.id)}
          >
            + Add Expense
          </Button>
        </div>

        {campaignExpenses.length === 0 ? (
          <div className="p-3 bg-neutral-50 rounded-lg text-center text-xs text-neutral-400">
            No additional operational expenses recorded for this campaign.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {campaignExpenses.map(exp => (
              <div
                key={exp.id}
                className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex items-center justify-between shadow-2xs"
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
                    className="text-neutral-400 hover:text-red-600 p-0.5 transition-colors"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Audit Trail Section (if changes were recorded) */}
      {campaign.audit_trail && campaign.audit_trail.length > 0 && (
        <div className="text-xs border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-800 font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audit Trail & Change History ({campaign.audit_trail.length})</span>
            {showAuditTrail ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {showAuditTrail && (
            <div className="mt-2 space-y-1.5 p-3 rounded-lg bg-white border border-neutral-200 text-[11px] animate-in fade-in">
              {campaign.audit_trail.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-neutral-600 border-b border-neutral-100 pb-1">
                  <span>
                    <strong className="text-neutral-900">{entry.action}:</strong> {entry.details}
                  </span>
                  <span className="text-neutral-400 font-mono text-[10px]">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
