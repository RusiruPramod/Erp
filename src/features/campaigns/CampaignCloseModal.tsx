import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import {
  AdCampaign,
  AdCampaignExpense,
  AdCampaignOrder,
  CampaignStatus,
  ExpenseAllocationMethod,
} from '../../types';
import { formatLKR, formatDateInput, formatDate } from '../../lib/formatters';
import {
  calculateOrderFinancials,
  computeOrderAdAllocations,
} from '../../services/adCalculations';
import {
  DollarSign,
  Receipt,
  Plus,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface CampaignCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: AdCampaign | null;
  orders?: AdCampaignOrder[];
  expenses: AdCampaignExpense[];
  onSaveAndClose: (
    campaignId: string,
    updates: {
      status: CampaignStatus;
      end_date: string;
      ad_spend_usd: number;
      exchange_rate: number;
      ad_spend_lkr: number;
      allocation_method?: ExpenseAllocationMethod;
      notes?: string | null;
    },
    newExpenses?: Array<{
      category: 'Packaging' | 'Delivery' | 'Material purchases' | 'Reload / Internet Expenses' | 'Additional Outsourcing' | 'Operational' | 'Other';
      description: string;
      expense_date: string;
      amount: number;
      currency: 'LKR' | 'USD';
      exchange_rate: number;
      amount_lkr: number;
      allocation_method?: ExpenseAllocationMethod;
      notes?: string | null;
    }>
  ) => Promise<void>;
  onOpenAddExpenseModal: () => void;
}

export const CampaignCloseModal: React.FC<CampaignCloseModalProps> = ({
  isOpen,
  onClose,
  campaign,
  orders = [],
  expenses,
  onSaveAndClose,
  onOpenAddExpenseModal,
}) => {
  if (!campaign) return null;

  const [endDate, setEndDate] = useState(formatDateInput(campaign.end_date || new Date()));
  const [targetStatus, setTargetStatus] = useState<CampaignStatus>(
    campaign.status === 'running' ? 'closed' : campaign.status
  );
  const [adSpendUsd, setAdSpendUsd] = useState<number | ''>(campaign.ad_spend_usd || '');
  const [exchangeRate, setExchangeRate] = useState<number | ''>(campaign.exchange_rate || 305);
  const [adSpendLkr, setAdSpendLkr] = useState<number | ''>(campaign.ad_spend_lkr || '');
  const [allocationMethod, setAllocationMethod] = useState<ExpenseAllocationMethod>(
    campaign.allocation_method || 'revenue_based'
  );
  const [notes, setNotes] = useState(campaign.notes || '');
  const [confirmedClose, setConfirmedClose] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick inline additional expense
  const [showInlineExpense, setShowInlineExpense] = useState(false);
  const [quickExpDesc, setQuickExpDesc] = useState('');
  const [quickExpCategory, setQuickExpCategory] = useState<
    'Packaging' | 'Delivery' | 'Material purchases' | 'Reload / Internet Expenses' | 'Additional Outsourcing' | 'Operational' | 'Other'
  >('Packaging');
  const [quickExpAmount, setQuickExpAmount] = useState<number | ''>('');
  const [pendingNewExpenses, setPendingNewExpenses] = useState<
    Array<{
      category: 'Packaging' | 'Delivery' | 'Material purchases' | 'Reload / Internet Expenses' | 'Additional Outsourcing' | 'Operational' | 'Other';
      description: string;
      expense_date: string;
      amount: number;
      currency: 'LKR' | 'USD';
      exchange_rate: number;
      amount_lkr: number;
      allocation_method?: ExpenseAllocationMethod;
      notes?: string | null;
    }>
  >([]);

  useEffect(() => {
    if (campaign) {
      setEndDate(formatDateInput(campaign.end_date || new Date()));
      setTargetStatus(campaign.status === 'running' ? 'closed' : campaign.status);
      setAdSpendUsd(campaign.ad_spend_usd || '');
      setExchangeRate(campaign.exchange_rate || 305);
      setAdSpendLkr(campaign.ad_spend_lkr || '');
      setAllocationMethod(campaign.allocation_method || 'revenue_based');
      setNotes(campaign.notes || '');
      setConfirmedClose(false);
      setPendingNewExpenses([]);
      setShowInlineExpense(false);
    }
  }, [campaign, isOpen]);

  const handleUsdChange = (val: number | '') => {
    setAdSpendUsd(val);
    if (typeof val === 'number') {
      const rate = Number(exchangeRate) || 305;
      setAdSpendLkr(Math.round(val * rate * 100) / 100);
    }
  };

  const handleRateChange = (val: number | '') => {
    setExchangeRate(val);
    if (typeof val === 'number' && typeof adSpendUsd === 'number') {
      setAdSpendLkr(Math.round(adSpendUsd * val * 100) / 100);
    }
  };

  // Orders linked to this campaign
  const campaignOrders = orders.filter(o => o.campaign_id === campaign.id);

  // Financial calculations
  const currentAdSpendLkr = Number(adSpendLkr) || 0;
  const existingExpensesTotal = expenses
    .filter(e => e.campaign_id === campaign.id)
    .reduce((sum, e) => sum + (Number(e.amount_lkr) || Number(e.amount) || 0), 0);

  const pendingExpensesTotal = pendingNewExpenses.reduce((sum, e) => sum + e.amount_lkr, 0);
  const totalOtherExpenses = existingExpensesTotal + pendingExpensesTotal;

  // Order Allocations
  const allocationMap = computeOrderAdAllocations(campaignOrders, currentAdSpendLkr, allocationMethod);

  let confirmedCount = 0;
  let pendingCount = 0;
  let totalConfirmedCustomerPrice = 0;
  let totalConfirmedSupplierCost = 0;
  let totalAllocatedAdSpend = 0;
  let pendingOrderValue = 0;
  let pendingSupplierCost = 0;
  let outstandingCustomerPayments = 0;
  let totalRealizedProfit = 0;

  campaignOrders.forEach(order => {
    const allocShare = allocationMap.get(order.id) || 0;
    const fin = calculateOrderFinancials(order, 0, 0, allocShare);

    if (fin.is_confirmed) {
      confirmedCount += 1;
      totalConfirmedCustomerPrice += fin.revenue;
      totalConfirmedSupplierCost += fin.supplier_costs;
      totalAllocatedAdSpend += allocShare;
      outstandingCustomerPayments += fin.customer_balance;
      totalRealizedProfit += fin.realized_profit > 0 ? fin.realized_profit : fin.gross_profit;
    } else {
      pendingCount += 1;
      pendingOrderValue += fin.revenue;
      pendingSupplierCost += fin.supplier_costs;
    }
  });

  const expectedGrossProfit = totalConfirmedCustomerPrice - totalConfirmedSupplierCost;
  const unallocatedAdSpend = Math.max(0, Math.round((currentAdSpendLkr - totalAllocatedAdSpend) * 100) / 100);
  const netProfitAfterExpenses = expectedGrossProfit - currentAdSpendLkr - totalOtherExpenses;

  const handleAddQuickExpense = () => {
    if (!quickExpDesc.trim() || !quickExpAmount || Number(quickExpAmount) <= 0) return;
    const amountNum = Number(quickExpAmount);
    setPendingNewExpenses([
      ...pendingNewExpenses,
      {
        category: quickExpCategory,
        description: quickExpDesc.trim(),
        expense_date: formatDateInput(new Date()),
        amount: amountNum,
        currency: 'LKR',
        exchange_rate: 305,
        amount_lkr: amountNum,
      },
    ]);
    setQuickExpDesc('');
    setQuickExpAmount('');
    setShowInlineExpense(false);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetStatus === 'closed' && !confirmedClose) {
      alert('Please check the confirmation box to review and close this campaign.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalUsd = Number(adSpendUsd) || 0;
      const finalRate = Number(exchangeRate) || 305;
      const finalLkr =
        typeof adSpendLkr === 'number' && adSpendLkr >= 0
          ? adSpendLkr
          : Math.round(finalUsd * finalRate * 100) / 100;

      await onSaveAndClose(
        campaign.id,
        {
          status: targetStatus,
          end_date: endDate,
          ad_spend_usd: finalUsd,
          exchange_rate: finalRate,
          ad_spend_lkr: finalLkr,
          allocation_method: allocationMethod,
          notes: notes.trim() || null,
        },
        pendingNewExpenses
      );
      onClose();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Close Campaign & Settle Ad Spend: ${campaign.campaign_code}`}
      description="Review campaign orders, enter final actual Meta ad spend in USD/LKR, choose expense allocation, and finalize the ledger."
      maxWidth="2xl"
    >
      <form onSubmit={handleFinalSubmit} className="space-y-4">
        {/* Campaign Info Header */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 text-white">
                {campaign.campaign_code}
              </span>
              <span className="text-xs font-bold text-neutral-900">{campaign.name}</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Started: {formatDate(campaign.start_date)} • Meta Ref: {campaign.fb_campaign_ref || 'None'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
            {campaignOrders.length} Linked Orders
          </span>
        </div>

        {/* Status, End Date, Allocation Method */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Campaign Status"
            value={targetStatus}
            onChange={e => setTargetStatus(e.target.value as CampaignStatus)}
            options={[
              { value: 'closed', label: 'Closed (Finalized session)' },
              { value: 'review', label: 'Closing / In Review' },
              { value: 'running', label: 'Running (Keep Active)' },
              { value: 'archived', label: 'Archived (Historical)' },
            ]}
          />

          <Input
            type="date"
            label="Campaign End Date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />

          <Select
            label="Expense Allocation Method"
            value={allocationMethod}
            onChange={e => setAllocationMethod(e.target.value as ExpenseAllocationMethod)}
            options={[
              { value: 'revenue_based', label: 'Revenue-Based Allocation' },
              { value: 'equal', label: 'Equal Allocation per Order' },
              { value: 'manual', label: 'Manual Order Allocation' },
            ]}
          />
        </div>

        {/* Final Advertising Expenditure (USD & LKR) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#FF8C00]" /> Actual Final Meta Advertising Spend
            </span>
            <span className="text-[11px] text-neutral-500">Facebook Meta Ads Invoice</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="number"
              step="0.01"
              min="0"
              label="Final Ad Spend (USD $)"
              placeholder="e.g. 2.36"
              value={adSpendUsd}
              onChange={e => handleUsdChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText="Exact billed Meta spend"
            />

            <Input
              type="number"
              step="0.5"
              min="1"
              label="Exchange Rate (USD to LKR)"
              value={exchangeRate}
              onChange={e => handleRateChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText="Configurable exchange rate"
            />

            <Input
              type="number"
              step="0.01"
              min="0"
              label="Final Spend (LKR)"
              value={adSpendLkr}
              onChange={e => setAdSpendLkr(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText="Calculated or manual LKR"
            />
          </div>
        </div>

        {/* 1. Review Orders in this Campaign */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-neutral-700" /> Linked Campaign Orders & Cost Allocation
            </span>
            <span className="text-[11px] text-neutral-500">
              {campaignOrders.length} order(s) received
            </span>
          </div>

          {campaignOrders.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2 text-center bg-neutral-50 rounded-lg">
              No orders linked to this campaign yet. Ad spend will be marked as unallocated.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {campaignOrders.map(order => {
                const allocShare = allocationMap.get(order.id) || 0;
                const fin = calculateOrderFinancials(order, 0, 0, allocShare);

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80"
                  >
                    <div>
                      <span className="font-semibold text-neutral-900">{order.order_name}</span>
                      <div className="text-[10px] text-neutral-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{order.order_number}</span>
                        <span>•</span>
                        <span>{order.customer_name || 'Direct'}</span>
                        <span>•</span>
                        <span className="capitalize">{order.status}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-neutral-900">
                        {fin.has_incomplete_financials ? (
                          <span className="text-amber-600 font-medium">Pending Quote</span>
                        ) : (
                          formatLKR(fin.revenue)
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Allocated Ad: <strong className="text-[#FF8C00]">{formatLKR(allocShare)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Operational Expenses */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-neutral-600" /> Operational & Additional Expenses
              </span>
              <p className="text-[11px] text-neutral-500">Packaging, delivery courier fees, reload costs</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowInlineExpense(!showInlineExpense)}
            >
              Add Expense
            </Button>
          </div>

          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {expenses
              .filter(e => e.campaign_id === campaign.id)
              .map(exp => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-50 border border-neutral-200/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-700">[{exp.category}]</span>
                    <span className="text-neutral-600 truncate max-w-xs">{exp.description}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-900">
                    {formatLKR(Number(exp.amount_lkr || exp.amount))}
                  </span>
                </div>
              ))}

            {pendingNewExpenses.map((exp, idx) => (
              <div
                key={`pending-${idx}`}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-orange-50/60 border border-orange-200 text-orange-900"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">[{exp.category}] (New)</span>
                  <span className="truncate max-w-xs">{exp.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{formatLKR(exp.amount_lkr)}</span>
                  <button
                    type="button"
                    onClick={() => setPendingNewExpenses(pendingNewExpenses.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {expenses.filter(e => e.campaign_id === campaign.id).length === 0 &&
              pendingNewExpenses.length === 0 && (
                <p className="text-xs text-neutral-400 py-1 text-center">No other expenses recorded.</p>
              )}
          </div>

          {showInlineExpense && (
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  className="text-xs rounded border border-neutral-200 p-1.5 bg-white"
                  value={quickExpCategory}
                  onChange={e => setQuickExpCategory(e.target.value as any)}
                >
                  <option value="Packaging">Packaging</option>
                  <option value="Delivery">Delivery / Courier</option>
                  <option value="Material purchases">Material Purchases</option>
                  <option value="Reload / Internet Expenses">Reload / Internet</option>
                  <option value="Additional Outsourcing">Additional Outsourcing</option>
                  <option value="Operational">Operational</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Description (e.g. Courier fee)"
                  className="text-xs rounded border border-neutral-200 p-1.5"
                  value={quickExpDesc}
                  onChange={e => setQuickExpDesc(e.target.value)}
                />

                <input
                  type="number"
                  step="50"
                  min="0"
                  placeholder="Amount in LKR"
                  className="text-xs rounded border border-neutral-200 p-1.5 font-mono"
                  value={quickExpAmount}
                  onChange={e => setQuickExpAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowInlineExpense(false)}>
                  Cancel
                </Button>
                <Button variant="secondary" size="sm" type="button" onClick={handleAddQuickExpense}>
                  Save Expense
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Section 9 Campaign Close Financial Summary Box */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 text-white p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs text-neutral-300">
            <span className="font-bold uppercase tracking-wider text-[#FF8C00]">
              Campaign Close Financial Ledger Summary
            </span>
            <span className="text-[11px] text-neutral-400">
              Expected vs Realized Gross Profit & Net Returns
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Actual Ad Spend (USD)</span>
              <span className="font-mono font-bold text-white text-sm">
                ${Number(adSpendUsd || 0).toFixed(2)} USD
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Actual Ad Spend (LKR)</span>
              <span className="font-mono font-bold text-[#FF8C00] text-sm">
                {formatLKR(currentAdSpendLkr)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Other Expenses</span>
              <span className="font-mono font-bold text-neutral-300 text-sm">
                {formatLKR(totalOtherExpenses)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Total Orders</span>
              <span className="font-mono font-bold text-sky-400 text-sm">
                {campaignOrders.length} ({confirmedCount} Confirmed)
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Confirmed Customer Price</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatLKR(totalConfirmedCustomerPrice)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Confirmed Supplier Cost</span>
              <span className="font-mono font-bold text-neutral-300 text-sm">
                {formatLKR(totalConfirmedSupplierCost)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Expected Gross Profit</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatLKR(expectedGrossProfit)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase block">Net Profit After Expenses</span>
              <span className="font-mono font-bold text-emerald-300 text-base">
                {formatLKR(netProfitAfterExpenses)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
            <div>
              <span>Allocated Ad Spend: </span>
              <strong className="text-white font-mono">{formatLKR(totalAllocatedAdSpend)}</strong>
              {unallocatedAdSpend > 0 && (
                <span className="text-amber-400 ml-1">({formatLKR(unallocatedAdSpend)} unallocated)</span>
              )}
            </div>
            <div>
              <span>Pending Order Value: </span>
              <strong className="text-amber-400 font-mono">
                {pendingOrderValue > 0 ? formatLKR(pendingOrderValue) : 'None'}
              </strong>
            </div>
            <div>
              <span>Outstanding Customer Balance: </span>
              <strong className="text-rose-400 font-mono">
                {formatLKR(outstandingCustomerPayments)}
              </strong>
            </div>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        {targetStatus === 'closed' && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="confirmCloseCheck"
              checked={confirmedClose}
              onChange={e => setConfirmedClose(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 text-[#FF8C00] focus:ring-[#FF8C00]"
            />
            <label htmlFor="confirmCloseCheck" className="text-xs text-neutral-800 font-medium cursor-pointer">
              I confirm the actual billed Meta ad spend of <strong>${Number(adSpendUsd || 0).toFixed(2)} USD ({formatLKR(currentAdSpendLkr)})</strong>, the order pricing breakdown, and want to close this ad campaign session.
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            disabled={targetStatus === 'closed' && !confirmedClose}
          >
            {targetStatus === 'closed' ? 'Confirm & Close Campaign' : 'Save Campaign Settlement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
