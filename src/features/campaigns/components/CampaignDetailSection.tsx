import React from 'react';
import { AdCampaign, AdCampaignExpense } from '../../../types';
import { formatLKR, formatDate } from '../../../lib/formatters';
import { CampaignStatusBadge } from './Badges';
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
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface CampaignDetailSectionProps {
  campaign: AdCampaign;
  expenses: AdCampaignExpense[];
  onAddExpense: (campaignId: string) => void;
  onDeleteExpense: (expense: AdCampaignExpense) => void;
  onOpenCloseModal: (campaign: AdCampaign) => void;
  onEditCampaign: (campaign: AdCampaign) => void;
}

export const CampaignDetailSection: React.FC<CampaignDetailSectionProps> = ({
  campaign,
  expenses,
  onAddExpense,
  onDeleteExpense,
  onOpenCloseModal,
  onEditCampaign,
}) => {
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

      {/* 3. Operational Expenses (Packaging, Courier, etc.) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-neutral-600" /> Additional Campaign Expenses
            </h4>
            <p className="text-[11px] text-neutral-500">
              Packaging boxes, delivery courier fees, and materials for this ad session.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddExpense(campaign.id)}
          >
            Add Expense
          </Button>
        </div>

        {campaignExpenses.length === 0 ? (
          <div className="p-3 bg-white rounded-lg border border-neutral-200 text-center text-xs text-neutral-400">
            No operational expenses recorded for this campaign.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {campaignExpenses.map(exp => (
              <div
                key={exp.id}
                className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center justify-between shadow-2xs"
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
    </div>
  );
};
