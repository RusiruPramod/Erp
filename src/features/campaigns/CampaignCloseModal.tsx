import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import {
  AdCampaign,
  AdCampaignOrder,
  AdCampaignExpense,
  CampaignStatus,
} from '../../types';
import { calculateOrderFinancials } from '../../services/adCalculations';
import { formatLKR, formatDateInput } from '../../lib/formatters';
import {
  AlertTriangle,
  Plus,
  DollarSign,
  Receipt,
} from 'lucide-react';

interface CampaignCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: AdCampaign | null;
  orders: AdCampaignOrder[];
  expenses: AdCampaignExpense[];
  onSaveAndClose: (
    campaignId: string,
    updates: {
      status: CampaignStatus;
      end_date: string;
      ad_spend_usd: number;
      exchange_rate: number;
      ad_spend_lkr: number;
      notes?: string | null;
    },
    newExpenses?: Array<{
      category: 'Packaging' | 'Delivery' | 'Material purchases' | 'Operational' | 'Other';
      description: string;
      expense_date: string;
      amount: number;
      currency: 'LKR' | 'USD';
      exchange_rate: number;
      amount_lkr: number;
      notes?: string | null;
    }>
  ) => Promise<void>;
  onOpenAddExpenseModal: () => void;
}

export const CampaignCloseModal: React.FC<CampaignCloseModalProps> = ({
  isOpen,
  onClose,
  campaign,
  orders,
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
  const [notes, setNotes] = useState(campaign.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick inline additional expense fields
  const [showInlineExpense, setShowInlineExpense] = useState(false);
  const [quickExpDesc, setQuickExpDesc] = useState('');
  const [quickExpCategory, setQuickExpCategory] = useState<
    'Packaging' | 'Delivery' | 'Material purchases' | 'Operational' | 'Other'
  >('Packaging');
  const [quickExpAmount, setQuickExpAmount] = useState<number | ''>('');
  const [pendingNewExpenses, setPendingNewExpenses] = useState<
    Array<{
      category: 'Packaging' | 'Delivery' | 'Material purchases' | 'Operational' | 'Other';
      description: string;
      expense_date: string;
      amount: number;
      currency: 'LKR' | 'USD';
      exchange_rate: number;
      amount_lkr: number;
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
      setNotes(campaign.notes || '');
      setPendingNewExpenses([]);
      setShowInlineExpense(false);
    }
  }, [campaign, isOpen]);

  // Handle USD to LKR conversion
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

  // Filter orders for this campaign
  const campaignOrders = orders.filter(o => o.campaign_id === campaign.id);
  const confirmedOrders = campaignOrders.filter(o =>
    ['confirmed', 'in_progress', 'completed'].includes(o.status)
  );
  const pendingOrders = campaignOrders.filter(o => o.status === 'pending');

  // Sum confirmed orders
  let totalRevenue = 0;
  let totalSupplierCosts = 0;
  let hasIncomplete = false;

  confirmedOrders.forEach(order => {
    const fin = calculateOrderFinancials(order, 0, 0);
    if (fin.has_incomplete_financials) hasIncomplete = true;
    totalRevenue += fin.revenue;
    totalSupplierCosts += fin.supplier_costs;
  });

  const grossProfit = totalRevenue - totalSupplierCosts;

  // Existing expenses + pending new expenses
  const existingExpensesTotal = expenses
    .filter(e => e.campaign_id === campaign.id)
    .reduce((sum, e) => sum + (Number(e.amount_lkr) || Number(e.amount) || 0), 0);

  const pendingExpensesTotal = pendingNewExpenses.reduce((sum, e) => sum + e.amount_lkr, 0);
  const totalOtherExpenses = existingExpensesTotal + pendingExpensesTotal;

  // Ad Spend in LKR
  const currentAdSpendLkr = Number(adSpendLkr) || 0;

  // Final Net Profit = Gross Profit - Ad Spend LKR - Other Expenses
  const finalNetProfit = grossProfit - currentAdSpendLkr - totalOtherExpenses;

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
      title={`Close / Review Campaign: ${campaign.campaign_code}`}
      description="Review campaign revenue, orders, enter actual final Meta advertising spend, add operational costs, and calculate net business profit."
      maxWidth="2xl"
    >
      <form onSubmit={handleFinalSubmit} className="space-y-5">
        {/* Campaign Header Summary */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2 mb-3">
            <div>
              <span className="text-xs font-bold text-neutral-900">{campaign.name}</span>
              {campaign.fb_campaign_ref && (
                <span className="text-[11px] text-neutral-500 ml-2">
                  (Ref: {campaign.fb_campaign_ref})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">
                Started: <span className="font-semibold text-neutral-800">{campaign.start_date}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white rounded-lg p-2.5 border border-neutral-200/80">
              <p className="text-[10px] uppercase font-semibold text-neutral-500">Confirmed Orders</p>
              <p className="text-base font-bold text-neutral-900">{confirmedOrders.length}</p>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-neutral-200/80">
              <p className="text-[10px] uppercase font-semibold text-neutral-500">Pending Inquiries</p>
              <p className="text-base font-bold text-amber-600">{pendingOrders.length}</p>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-neutral-200/80">
              <p className="text-[10px] uppercase font-semibold text-neutral-500">Confirmed Revenue</p>
              <p className="text-base font-bold font-mono text-neutral-900">{formatLKR(totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-neutral-200/80">
              <p className="text-[10px] uppercase font-semibold text-neutral-500">Gross Profit</p>
              <p className="text-base font-bold font-mono text-[#FF8C00]">{formatLKR(grossProfit)}</p>
            </div>
          </div>

          {hasIncomplete && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                One or more confirmed orders have incomplete service pricing. Missing amounts are excluded
                from totals. You can update them at any time.
              </span>
            </div>
          )}
        </div>

        {/* Closing Status & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Target Status"
            value={targetStatus}
            onChange={e => setTargetStatus(e.target.value as CampaignStatus)}
            options={[
              { value: 'closed', label: 'Closed (Finalized session)' },
              { value: 'review', label: 'Closing / In Review' },
              { value: 'running', label: 'Keep Running (Update spend only)' },
            ]}
          />

          <Input
            type="date"
            label="Campaign End Date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        {/* Final Advertising Expenditure Section */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#FF8C00]" /> Actual Final Advertising Spend
            </span>
            <span className="text-[11px] text-neutral-500">Enter final Meta Ads invoice amount</span>
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
              helperText="Conversion rate used"
            />

            <Input
              type="number"
              step="0.01"
              min="0"
              label="Final Ad Spend (LKR)"
              value={adSpendLkr}
              onChange={e => setAdSpendLkr(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText="Calculated or manual LKR"
            />
          </div>
        </div>

        {/* Additional Operational Expenses Section */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-neutral-600" /> Additional Campaign Expenses
              </span>
              <p className="text-[11px] text-neutral-500">Packaging, delivery couriers, material purchases</p>
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

          {/* List existing & pending expenses */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
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
                <p className="text-xs text-neutral-400 py-1 text-center">No other operational expenses recorded.</p>
              )}
          </div>

          {/* Inline quick add */}
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
                  <option value="Operational">Operational</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Description (e.g. Courier charge)"
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

        {/* Final Financial Summary Highlight Box */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-900 text-white p-5 shadow-md">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Final Campaign Financial Settlement
            </span>
            <span className="text-xs text-[#FF8C00] font-semibold">
              Gross Profit − Ad Spend − Other Expenses
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Gross Profit</p>
              <p className="text-sm font-bold font-mono text-neutral-200">{formatLKR(grossProfit)}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Ad Spend (LKR)</p>
              <p className="text-sm font-bold font-mono text-red-400">− {formatLKR(currentAdSpendLkr)}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Other Expenses</p>
              <p className="text-sm font-bold font-mono text-amber-400">− {formatLKR(totalOtherExpenses)}</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-1.5 border border-neutral-700">
              <p className="text-[10px] text-[#FF8C00] uppercase tracking-wider font-bold">Net Profit</p>
              <p
                className={`text-base font-extrabold font-mono ${
                  finalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatLKR(finalNetProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Save Financial Summary & Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};
