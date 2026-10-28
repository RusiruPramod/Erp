import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone,
  Plus,
  Search,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Globe,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { adCampaignService } from '../../services/adCampaignService';
import {
  AdCampaign,
  AdCampaignExpense,
  CampaignStatus,
} from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csv';
import { CampaignStatusBadge } from './components/Badges';
import { CampaignDetailSection } from './components/CampaignDetailSection';
import { CampaignModal } from './CampaignModal';
import { CampaignCloseModal } from './CampaignCloseModal';
import { CampaignExpenseModal } from './CampaignExpenseModal';
import { toast } from 'sonner';

export const AdCampaignLedgerPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | 'thisMonth'>('all');

  // Expanded row state
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>('camp-run-001');

  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<AdCampaign | null>(null);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [campaignToClose, setCampaignToClose] = useState<AdCampaign | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalCampaignId, setExpenseModalCampaignId] = useState<string>('');
  const [expenseToEdit, setExpenseToEdit] = useState<AdCampaignExpense | null>(null);

  // Deletion confirm dialogs
  const [campaignToDelete, setCampaignToDelete] = useState<AdCampaign | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<AdCampaignExpense | null>(null);

  // 1. Fetch campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<AdCampaign[]>({
    queryKey: ['ad-campaigns'],
    queryFn: () => adCampaignService.getCampaigns(),
  });

  // 2. Fetch expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<AdCampaignExpense[]>({
    queryKey: ['ad-expenses'],
    queryFn: () => adCampaignService.getExpenses(),
  });

  const isLoading = isLoadingCampaigns || isLoadingExpenses;

  // Mutations
  const campaignMutation = useMutation({
    mutationFn: async (data: any) => {
      if (campaignToEdit) {
        return adCampaignService.updateCampaign(campaignToEdit.id, data);
      }
      return adCampaignService.createCampaign(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      toast.success(campaignToEdit ? 'Campaign updated' : 'New campaign started');
    },
    onError: err => {
      toast.error('Failed to save campaign: ' + (err as Error).message);
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => adCampaignService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['ad-expenses'] });
      toast.success('Campaign removed');
      setCampaignToDelete(null);
    },
    onError: err => {
      toast.error('Failed to delete campaign: ' + (err as Error).message);
    },
  });

  const expenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return adCampaignService.createExpense(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-expenses'] });
      toast.success('Expense recorded');
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => adCampaignService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-expenses'] });
      toast.success('Expense deleted');
      setExpenseToDelete(null);
    },
  });

  const closeCampaignMutation = useMutation({
    mutationFn: async ({
      campaignId,
      updates,
      newExpenses,
    }: {
      campaignId: string;
      updates: any;
      newExpenses?: any[];
    }) => {
      await adCampaignService.updateCampaign(campaignId, updates);
      if (newExpenses && newExpenses.length > 0) {
        for (const exp of newExpenses) {
          await adCampaignService.createExpense({
            ...exp,
            campaign_id: campaignId,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['ad-expenses'] });
      toast.success('Ad spend settlement saved');
    },
    onError: err => {
      toast.error('Failed to settle spend: ' + (err as Error).message);
    },
  });

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter(c => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(term);
      const matchCode = c.campaign_code?.toLowerCase().includes(term);
      const matchRef = c.fb_campaign_ref?.toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchRef) return false;
    }

    // Status
    if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }

    // Date
    if (dateFilter === 'thisMonth') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (!c.start_date.startsWith(currentMonth)) return false;
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(c.start_date) < thirtyDaysAgo) return false;
    }

    return true;
  });

  // Metrics for Ad Campaigns
  let totalAdSpendUsd = 0;
  let totalAdSpendLkr = 0;
  let totalOtherExpensesLkr = 0;
  let runningCount = 0;
  let closedCount = 0;

  filteredCampaigns.forEach(campaign => {
    if (campaign.status === 'running') runningCount += 1;
    if (campaign.status === 'closed') closedCount += 1;

    const usd = Number(campaign.ad_spend_usd) || 0;
    const rate = Number(campaign.exchange_rate) || 305;
    const lkr = Number(campaign.ad_spend_lkr) > 0 ? Number(campaign.ad_spend_lkr) : usd * rate;

    totalAdSpendUsd += usd;
    totalAdSpendLkr += lkr;

    const campExpenses = expenses
      .filter(e => e.campaign_id === campaign.id)
      .reduce((sum, e) => sum + (Number(e.amount_lkr) || Number(e.amount) || 0), 0);

    totalOtherExpensesLkr += campExpenses;
  });

  const totalAllExpenditure = totalAdSpendLkr + totalOtherExpensesLkr;

  // Reset to Sample Data Handler
  const handleResetSampleData = () => {
    adCampaignService.resetToSampleData();
    queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
    queryClient.invalidateQueries({ queryKey: ['ad-expenses'] });
    toast.success('Ad campaigns reset to sample data');
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const rows = filteredCampaigns.map(c => {
      const campExp = expenses
        .filter(e => e.campaign_id === c.id)
        .reduce((sum, e) => sum + (Number(e.amount_lkr) || Number(e.amount) || 0), 0);
      const usd = Number(c.ad_spend_usd) || 0;
      const rate = Number(c.exchange_rate) || 305;
      const lkr = Number(c.ad_spend_lkr) > 0 ? Number(c.ad_spend_lkr) : usd * rate;

      return {
        'Campaign ID': c.campaign_code,
        'Campaign Name': c.name,
        'Facebook Ad Reference': c.fb_campaign_ref || '',
        'Start Date': c.start_date,
        'End Date': c.end_date || 'Active',
        Status: c.status.toUpperCase(),
        'Ad Spend (USD)': usd.toFixed(2),
        'Exchange Rate (LKR/USD)': rate.toFixed(2),
        'Ad Spend (LKR)': lkr.toFixed(2),
        'Other Expenses (LKR)': campExp.toFixed(2),
        'Total Cost (LKR)': (lkr + campExp).toFixed(2),
        Notes: c.notes || '',
      };
    });
    exportToCsv(`ad-campaign-ledger-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Ad Campaign ledger exported to CSV');
  };

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-4 md:p-8">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF8C00] flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              Ad Campaign Ledger
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Facebook advertising campaigns, ad spend tracking in USD & LKR, and operational costs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleResetSampleData}
            title="Reset sample campaigns"
          >
            Sample Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
            disabled={filteredCampaigns.length === 0}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setCampaignToEdit(null);
              setIsCampaignModalOpen(true);
            }}
          >
            + New Ad Campaign
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Focused strictly on Ad Information & Spend) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Card 1: Total Ad Spend (USD) */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Total Ad Spend (USD)
          </span>
          <div className="font-mono font-bold text-lg text-neutral-900 mt-1">
            ${totalAdSpendUsd.toFixed(2)} USD
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Across {filteredCampaigns.length} campaigns</p>
        </div>

        {/* Card 2: Total Ad Spend (LKR) */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Total Ad Spend (LKR)
          </span>
          <div className="font-mono font-bold text-lg text-[#FF8C00] mt-1">
            {formatLKR(totalAdSpendLkr)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Converted at bank rate</p>
        </div>

        {/* Card 3: Running Advertisements */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Running Advertisements
          </span>
          <div className="font-mono font-bold text-lg text-emerald-700 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {runningCount} Active
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Currently receiving inquiries</p>
        </div>

        {/* Card 4: Closed Campaigns */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Closed Campaigns
          </span>
          <div className="font-mono font-bold text-lg text-neutral-800 mt-1">
            {closedCount} Closed
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Finalized ad sessions</p>
        </div>

        {/* Card 5: Operational Expenses */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Operational Expenses
          </span>
          <div className="font-mono font-bold text-lg text-neutral-700 mt-1">
            {formatLKR(totalOtherExpensesLkr)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Packaging, courier, reloads</p>
        </div>
      </div>

      {/* 3. Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campaign name, code, or Facebook ref..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00]"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200/80 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({campaigns.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('running')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'running'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Running ({campaigns.filter(c => c.status === 'running').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('review')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'review'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Review ({campaigns.filter(c => c.status === 'review').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'closed'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Closed ({campaigns.filter(c => c.status === 'closed').length})
            </button>
          </div>

          {/* Date range preset */}
          <div className="w-36">
            <select
              className="text-xs w-full rounded-lg border border-neutral-200 p-2 bg-white text-neutral-700"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
            >
              <option value="all">All Dates</option>
              <option value="thisMonth">This Month</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Ad Campaign Information Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={9} />
      ) : filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-8 h-8 text-[#FF8C00]" />}
          title="No advertising campaigns found"
          description="Create your first Facebook advertising campaign session to start tracking ad spend."
          actionLabel="+ New Ad Campaign"
          onAction={() => {
            setCampaignToEdit(null);
            setIsCampaignModalOpen(true);
          }}
        />
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/90 text-neutral-700 font-bold uppercase border-b border-neutral-200 text-[11px]">
                <th className="w-8 px-2 py-3"></th>
                <th className="px-3 py-3">Campaign Code</th>
                <th className="px-3 py-3">Campaign Title</th>
                <th className="px-3 py-3">Facebook Reference</th>
                <th className="px-3 py-3">Period</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Ad Spend (USD)</th>
                <th className="px-3 py-3 text-right">Exchange Rate</th>
                <th className="px-3 py-3 text-right font-bold">Ad Spend (LKR)</th>
                <th className="px-3 py-3 text-right">Other Expenses</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredCampaigns.map(campaign => {
                const isExpanded = expandedCampaignId === campaign.id;
                const usd = Number(campaign.ad_spend_usd) || 0;
                const rate = Number(campaign.exchange_rate) || 305;
                const lkr = Number(campaign.ad_spend_lkr) > 0 ? Number(campaign.ad_spend_lkr) : usd * rate;

                const campExp = expenses
                  .filter(e => e.campaign_id === campaign.id)
                  .reduce((sum, e) => sum + (Number(e.amount_lkr) || Number(e.amount) || 0), 0);

                return (
                  <React.Fragment key={campaign.id}>
                    <tr
                      className={`hover:bg-neutral-50/80 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-orange-50/20 font-medium' : ''
                      }`}
                      onClick={() => setExpandedCampaignId(isExpanded ? null : campaign.id)}
                    >
                      {/* Expand Chevron */}
                      <td className="px-2 py-3.5 text-center text-neutral-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#FF8C00]" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>

                      {/* Campaign Code */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 text-white">
                          {campaign.campaign_code}
                        </span>
                      </td>

                      {/* Campaign Title */}
                      <td className="px-3 py-3.5">
                        <div className="font-semibold text-neutral-900 text-xs">
                          {campaign.name}
                        </div>
                        {campaign.notes && (
                          <p className="text-[10px] text-neutral-400 truncate max-w-xs mt-0.5">
                            {campaign.notes}
                          </p>
                        )}
                      </td>

                      {/* Facebook Reference */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {campaign.fb_campaign_ref ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <Globe className="w-3 h-3" />
                            {campaign.fb_campaign_ref}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Period */}
                      <td className="px-3 py-3.5 text-neutral-600 whitespace-nowrap">
                        <div className="font-medium text-neutral-800">{formatDate(campaign.start_date)}</div>
                        <div className="text-[10px] text-neutral-400">
                          {campaign.end_date ? formatDate(campaign.end_date) : 'Ongoing'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <CampaignStatusBadge status={campaign.status} size="sm" />
                      </td>

                      {/* Ad Spend USD */}
                      <td className="px-3 py-3.5 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                        ${usd.toFixed(2)}
                      </td>

                      {/* Exchange Rate */}
                      <td className="px-3 py-3.5 text-right font-mono text-neutral-600 whitespace-nowrap">
                        {rate.toFixed(2)}
                      </td>

                      {/* Ad Spend LKR */}
                      <td className="px-3 py-3.5 text-right font-mono font-bold text-[#FF8C00] whitespace-nowrap">
                        {formatLKR(lkr)}
                      </td>

                      {/* Other Expenses */}
                      <td className="px-3 py-3.5 text-right font-mono text-neutral-600 whitespace-nowrap">
                        {campExp > 0 ? formatLKR(campExp) : '-'}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-3 py-3.5 text-center whitespace-nowrap"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCampaignToClose(campaign);
                              setIsCloseModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-[#FF8C00] bg-orange-50 hover:bg-orange-100 rounded transition-colors"
                            title="Settle final Meta spend"
                          >
                            Settle Spend
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCampaignToEdit(campaign);
                              setIsCampaignModalOpen(true);
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                            title="Edit campaign"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCampaignToDelete(campaign)}
                            className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-neutral-100"
                            title="Delete campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* 5. Expanded Ad Campaign Detail Section (Pure Ad Information & Expenses) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="p-0 border-b border-neutral-200">
                          <CampaignDetailSection
                            campaign={campaign}
                            expenses={expenses}
                            onAddExpense={cId => {
                              setExpenseModalCampaignId(cId);
                              setExpenseToEdit(null);
                              setIsExpenseModalOpen(true);
                            }}
                            onDeleteExpense={exp => setExpenseToDelete(exp)}
                            onOpenCloseModal={camp => {
                              setCampaignToClose(camp);
                              setIsCloseModalOpen(true);
                            }}
                            onEditCampaign={camp => {
                              setCampaignToEdit(camp);
                              setIsCampaignModalOpen(true);
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Campaign Modal (Create / Edit) */}
      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        campaignToEdit={campaignToEdit}
        onSave={async data => {
          await campaignMutation.mutateAsync(data);
        }}
      />

      {/* 2. Settle Spend & Close Campaign Modal */}
      <CampaignCloseModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        campaign={campaignToClose}
        expenses={expenses}
        onSaveAndClose={async (campaignId, updates, newExpenses) => {
          await closeCampaignMutation.mutateAsync({ campaignId, updates, newExpenses });
        }}
        onOpenAddExpenseModal={() => {
          if (campaignToClose) {
            setExpenseModalCampaignId(campaignToClose.id);
            setExpenseToEdit(null);
            setIsExpenseModalOpen(true);
          }
        }}
      />

      {/* 3. Campaign Expense Modal */}
      <CampaignExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        campaignId={expenseModalCampaignId}
        expenseToEdit={expenseToEdit}
        onSave={async data => {
          await expenseMutation.mutateAsync(data);
        }}
      />

      {/* CONFIRM DELETE DIALOGS */}
      <ConfirmDialog
        isOpen={Boolean(campaignToDelete)}
        onClose={() => setCampaignToDelete(null)}
        onConfirm={() => {
          if (campaignToDelete) deleteCampaignMutation.mutate(campaignToDelete.id);
        }}
        title="Delete Ad Campaign"
        message={`Are you sure you want to delete campaign "${campaignToDelete?.name}" (${campaignToDelete?.campaign_code})?`}
        confirmText="Delete Campaign"
        isDestructive
        isLoading={deleteCampaignMutation.isPending}
      />

      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) deleteExpenseMutation.mutate(expenseToDelete.id);
        }}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense "${expenseToDelete?.description}" (${formatLKR(
          expenseToDelete?.amount_lkr || expenseToDelete?.amount
        )})?`}
        confirmText="Delete Expense"
        isDestructive
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
};
