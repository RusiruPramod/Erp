import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { AdCampaign, AdCampaignExpense, CampaignStatus } from '../../types';
import { formatLKR, formatDateInput } from '../../lib/formatters';
import { DollarSign, Receipt, Plus } from 'lucide-react';

interface CampaignCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: AdCampaign | null;
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

  // Existing expenses + pending new expenses
  const existingExpensesTotal = expenses
    .filter(e => e.campaign_id === campaign.id)
    .reduce((sum, e) => sum + (Number(e.amount_lkr) || Number(e.amount) || 0), 0);

  const pendingExpensesTotal = pendingNewExpenses.reduce((sum, e) => sum + e.amount_lkr, 0);
  const totalOtherExpenses = existingExpensesTotal + pendingExpensesTotal;

  // Final Ad Spend in LKR
  const currentAdSpendLkr = Number(adSpendLkr) || 0;
  const totalCampaignCost = currentAdSpendLkr + totalOtherExpenses;

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
      title={`Settle / Close Ad Campaign: ${campaign.campaign_code}`}
      description="Enter the actual final billed Meta advertising spend in USD, verify the exchange rate, and save ad expenditure."
      maxWidth="lg"
    >
      <form onSubmit={handleFinalSubmit} className="space-y-4">
        {/* Campaign Info */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-900">{campaign.name}</span>
            {campaign.fb_campaign_ref && (
              <span className="text-[11px] text-neutral-500 ml-2 font-mono">
                ({campaign.fb_campaign_ref})
              </span>
            )}
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Started: {campaign.start_date}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 text-white">
            {campaign.campaign_code}
          </span>
        </div>

        {/* Status & End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Campaign Status"
            value={targetStatus}
            onChange={e => setTargetStatus(e.target.value as CampaignStatus)}
            options={[
              { value: 'closed', label: 'Closed (Finalized session)' },
              { value: 'review', label: 'Closing / In Review' },
              { value: 'running', label: 'Running (Keep Active)' },
            ]}
          />

          <Input
            type="date"
            label="Campaign End Date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        {/* Final Advertising Expenditure */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#FF8C00]" /> Actual Meta Advertising Spend
            </span>
            <span className="text-[11px] text-neutral-500">Facebook Meta Ads invoice</span>
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
              helperText="Conversion rate"
            />

            <Input
              type="number"
              step="0.01"
              min="0"
              label="Final Ad Spend (LKR)"
              value={adSpendLkr}
              onChange={e => setAdSpendLkr(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText="Calculated LKR"
            />
          </div>
        </div>

        {/* Operational Expenses (Packaging, Courier, etc.) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-neutral-600" /> Operational Expenses
              </span>
              <p className="text-[11px] text-neutral-500">Packaging boxes, courier fees, reload costs</p>
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

          <div className="space-y-1.5 max-h-32 overflow-y-auto">
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

        {/* Total Ad & Campaign Expenditure Summary */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-900 text-white p-4">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-800 text-xs text-neutral-400">
            <span>Total Campaign Expenditure</span>
            <span>Meta Ads + Operational Costs</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-neutral-400 uppercase">Ad Spend (USD)</p>
              <p className="text-sm font-bold font-mono text-white">
                ${Number(adSpendUsd || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase">Ad Spend (LKR)</p>
              <p className="text-sm font-bold font-mono text-[#FF8C00]">
                {formatLKR(currentAdSpendLkr)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase">Total Expenditure</p>
              <p className="text-sm font-bold font-mono text-emerald-400">
                {formatLKR(totalCampaignCost)}
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
            Save Ad Spend
          </Button>
        </div>
      </form>
    </Modal>
  );
};
