import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone,
  Plus,
  Search,
  Download,
  DollarSign,
  TrendingUp,
  Receipt,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { adCampaignService } from '../../services/adCampaignService';
import {
  calculateCampaignFinancials,
  calculateLedgerOverallMetrics,
} from '../../services/adCalculations';
import {
  AdCampaign,
  AdCampaignOrder,
  AdCampaignExpense,
  CampaignStatus,
  OrderStatus,
} from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csv';
import { CampaignStatusBadge } from './components/Badges';
import { CampaignDetailSection } from './components/CampaignDetailSection';
import { CampaignModal } from './CampaignModal';
import { OrderModal } from './OrderModal';
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

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<AdCampaignOrder | null>(null);
  const [orderModalCampaignId, setOrderModalCampaignId] = useState<string | null>(null);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [campaignToClose, setCampaignToClose] = useState<AdCampaign | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalCampaignId, setExpenseModalCampaignId] = useState<string>('');
  const [expenseToEdit, setExpenseToEdit] = useState<AdCampaignExpense | null>(null);

  // Deletion confirm dialogs
  const [campaignToDelete, setCampaignToDelete] = useState<AdCampaign | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<AdCampaignOrder | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<AdCampaignExpense | null>(null);

  // 1. Fetch campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<AdCampaign[]>({
    queryKey: ['ad-campaigns'],
    queryFn: () => adCampaignService.getCampaigns(),
  });

  // 2. Fetch all orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<AdCampaignOrder[]>({
    queryKey: ['ad-orders'],
    queryFn: () => adCampaignService.getOrders(),
  });

  // 3. Fetch all expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<AdCampaignExpense[]>({
    queryKey: ['ad-expenses'],
    queryFn: () => adCampaignService.getExpenses(),
  });

  const isLoading = isLoadingCampaigns || isLoadingOrders || isLoadingExpenses;

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
      queryClient.invalidateQueries({ queryKey: ['ad-orders'] });
      queryClient.invalidateQueries({ queryKey: ['ad-expenses'] });
      toast.success('Campaign removed');
      setCampaignToDelete(null);
    },
    onError: err => {
      toast.error('Failed to delete campaign: ' + (err as Error).message);
    },
  });

  const orderMutation = useMutation({
    mutationFn: async ({ orderData, services }: { orderData: any; services: any[] }) => {
      if (orderToEdit) {
        return adCampaignService.updateOrder(orderToEdit.id, orderData, services);
      }
      return adCampaignService.createOrder(orderData, services);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-orders'] });
      toast.success(orderToEdit ? 'Order updated' : 'Order recorded');
    },
    onError: err => {
      toast.error('Failed to save order: ' + (err as Error).message);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => adCampaignService.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-orders'] });
      toast.success('Order deleted');
      setOrderToDelete(null);
    },
    onError: err => {
      toast.error('Failed to delete order: ' + (err as Error).message);
    },
  });

  const orderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      return adCampaignService.updateOrderStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-orders'] });
      toast.success('Order status updated');
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
      toast.success('Campaign review saved successfully');
    },
    onError: err => {
      toast.error('Failed to close campaign: ' + (err as Error).message);
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

  // Top summary cards metrics across filtered campaigns
  const metrics = calculateLedgerOverallMetrics(filteredCampaigns, orders, expenses);

  // Reset to Sample Data Handler
  const handleResetSampleData = () => {
    adCampaignService.resetToSampleData();
    queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
    queryClient.invalidateQueries({ queryKey: ['ad-orders'] });
    queryClient.invalidateQueries({ queryKey: ['ad-expenses'] });
    toast.success('Data reset to standard sample campaigns & orders');
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const rows = filteredCampaigns.map(c => {
      const fin = calculateCampaignFinancials(c, orders, expenses);
      return {
        'Campaign ID': c.campaign_code,
        'Campaign Name': c.name,
        'Facebook Ref': c.fb_campaign_ref || '',
        'Start Date': c.start_date,
        'End Date': c.end_date || 'Running',
        Status: c.status.toUpperCase(),
        'Ad Spend (USD)': fin.ad_spend_usd.toFixed(2),
        'Ad Spend (LKR)': fin.ad_spend_lkr.toFixed(2),
        'Confirmed Orders': fin.confirmed_orders_count,
        'Pending Inquiries': fin.pending_orders_count,
        'Total Revenue (LKR)': fin.total_revenue.toFixed(2),
        'Supplier Costs (LKR)': fin.total_supplier_costs.toFixed(2),
        'Gross Profit (LKR)': fin.gross_profit.toFixed(2),
        'Other Expenses (LKR)': fin.other_expenses_lkr.toFixed(2),
        'Net Profit (LKR)': fin.net_profit.toFixed(2),
      };
    });
    exportToCsv(`ad-campaign-ledger-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Campaign ledger exported to CSV');
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
            Session-by-session Facebook ad campaigns, confirmed orders, supplier costs, and net business profit.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleResetSampleData}
            title="Reset to sample orders & campaigns"
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
            Export
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setOrderToEdit(null);
              setOrderModalCampaignId(expandedCampaignId || null);
              setIsOrderModalOpen(true);
            }}
          >
            + Add Order
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

      {/* 2. Top Summary Cards (Section 3 of Prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
        {/* Card 1: Total Advertising Spend */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider truncate">
                Advertising Spend
              </span>
              <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <Megaphone className="w-3 h-3" />
              </div>
            </div>
            <div className="font-mono font-bold text-base text-neutral-900 truncate">
              ${metrics.total_ad_spend_usd.toFixed(2)} USD
            </div>
            <div className="text-[11px] font-mono text-neutral-500 mt-0.5 truncate">
              ≈ {formatLKR(metrics.total_ad_spend_lkr)}
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 truncate">Across {filteredCampaigns.length} campaigns</p>
        </div>

        {/* Card 2: Total Confirmed Revenue */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider truncate">
                Confirmed Revenue
              </span>
              <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <DollarSign className="w-3 h-3" />
              </div>
            </div>
            <div className="font-mono font-bold text-base text-neutral-900 truncate">
              {formatLKR(metrics.total_confirmed_revenue)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 truncate">Valid client orders</div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 truncate">Inquiries excluded</p>
        </div>

        {/* Card 3: Total Supplier Costs */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider truncate">
                Supplier Costs
              </span>
              <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <Receipt className="w-3 h-3" />
              </div>
            </div>
            <div className="font-mono font-bold text-base text-neutral-700 truncate">
              {formatLKR(metrics.total_supplier_costs)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 truncate">Outsource & direct</div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 truncate">Fabrication & parts</p>
        </div>

        {/* Card 4: Gross Profit */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider truncate">
                Gross Profit
              </span>
              <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div className="font-mono font-bold text-base text-[#FF8C00] truncate">
              {formatLKR(metrics.gross_profit)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 truncate">Revenue − Costs</div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 truncate">Order contribution</p>
        </div>

        {/* Card 5: Other Expenses */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider truncate">
                Other Expenses
              </span>
              <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center text-[#FF8C00] shrink-0">
                <Receipt className="w-3 h-3" />
              </div>
            </div>
            <div className="font-mono font-bold text-base text-neutral-700 truncate">
              {formatLKR(metrics.other_expenses_lkr)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 truncate">Courier & boxes</div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 truncate">Operational costs</p>
        </div>

        {/* Card 6: Net Profit */}
        <div
          className={`border rounded-xl p-3.5 shadow-2xs transition-all flex flex-col justify-between ${
            metrics.net_profit >= 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                Net Profit
              </span>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  metrics.net_profit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div
              className={`font-mono font-extrabold text-base truncate ${
                metrics.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatLKR(metrics.net_profit)}
            </div>
            <div className="text-[11px] text-neutral-600 mt-0.5 truncate">After Ads & Operations</div>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2 truncate">Real bottom-line</p>
        </div>
      </div>

      {/* Incomplete Records Global Banner */}
      {metrics.has_incomplete_records && (
        <div className="mb-4 flex items-center gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Note:</strong> Some orders have incomplete service pricing (such as pending supplier quotes).
            Missing amounts are excluded from revenue and profit calculations to ensure accurate business accounting.
          </span>
        </div>
      )}

      {/* 3. Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campaign name, ID, or Facebook reference..."
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

      {/* 4. Campaign Ledger Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={10} />
      ) : filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-8 h-8 text-[#FF8C00]" />}
          title="No advertising campaigns found"
          description="Create your first Facebook advertising campaign session to start tracking ad spend and orders."
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
                <th className="px-3 py-3">Campaign / ID</th>
                <th className="px-3 py-3">Period</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Ad Spend</th>
                <th className="px-3 py-3 text-center">Confirmed Orders</th>
                <th className="px-3 py-3 text-right">Total Revenue</th>
                <th className="px-3 py-3 text-right">Supplier Costs</th>
                <th className="px-3 py-3 text-right">Gross Profit</th>
                <th className="px-3 py-3 text-right font-extrabold">Net Profit</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredCampaigns.map(campaign => {
                const fin = calculateCampaignFinancials(campaign, orders, expenses);
                const isExpanded = expandedCampaignId === campaign.id;

                return (
                  <React.Fragment key={campaign.id}>
                    <tr
                      className={`hover:bg-neutral-50/80 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-orange-50/20 font-medium' : ''
                      }`}
                      onClick={() => setExpandedCampaignId(isExpanded ? null : campaign.id)}
                    >
                      {/* Expand Chevron Icon */}
                      <td className="px-2 py-3.5 text-center text-neutral-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#FF8C00]" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>

                      {/* Campaign Name & Code */}
                      <td className="px-3 py-3.5">
                        <div className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5 flex-wrap">
                          <span>{campaign.name}</span>
                          {campaign.fb_campaign_ref && (
                            <span className="text-[10px] text-neutral-400 font-mono">
                              ({campaign.fb_campaign_ref})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500">
                          {campaign.campaign_code}
                        </span>
                      </td>

                      {/* Start Date & End Date */}
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

                      {/* Advertising Spend (USD & LKR) */}
                      <td className="px-3 py-3.5 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-neutral-900">
                          ${fin.ad_spend_usd.toFixed(2)}
                        </div>
                        <div className="font-mono text-[10px] text-neutral-500">
                          {formatLKR(fin.ad_spend_lkr)}
                        </div>
                      </td>

                      {/* Confirmed Orders count */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-neutral-800">
                          <span>{fin.confirmed_orders_count}</span>
                          {fin.pending_orders_count > 0 && (
                            <span className="text-[10px] text-amber-600 font-normal">
                              (+{fin.pending_orders_count} pend)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Revenue */}
                      <td className="px-3 py-3.5 text-right font-mono font-semibold text-neutral-900 whitespace-nowrap">
                        {formatLKR(fin.total_revenue)}
                      </td>

                      {/* Supplier Costs */}
                      <td className="px-3 py-3.5 text-right font-mono text-neutral-600 whitespace-nowrap">
                        {formatLKR(fin.total_supplier_costs)}
                      </td>

                      {/* Gross Profit */}
                      <td className="px-3 py-3.5 text-right font-mono font-semibold text-neutral-900 whitespace-nowrap">
                        {formatLKR(fin.gross_profit)}
                      </td>

                      {/* Net Profit */}
                      <td className="px-3 py-3.5 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={fin.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}
                        >
                          {formatLKR(fin.net_profit)}
                        </span>
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
                              setOrderToEdit(null);
                              setOrderModalCampaignId(campaign.id);
                              setIsOrderModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                            title="Add Order to this campaign"
                          >
                            + Order
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCampaignToClose(campaign);
                              setIsCloseModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-[#FF8C00] bg-orange-50 hover:bg-orange-100 rounded transition-colors"
                            title="Review / Close campaign"
                          >
                            Review
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

                    {/* 5. Expanded Inline Section */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="p-0 border-b border-neutral-200">
                          <CampaignDetailSection
                            campaign={campaign}
                            orders={orders}
                            expenses={expenses}
                            onAddOrder={cId => {
                              setOrderToEdit(null);
                              setOrderModalCampaignId(cId);
                              setIsOrderModalOpen(true);
                            }}
                            onEditOrder={ord => {
                              setOrderToEdit(ord);
                              setOrderModalCampaignId(ord.campaign_id);
                              setIsOrderModalOpen(true);
                            }}
                            onDeleteOrder={ord => setOrderToDelete(ord)}
                            onConfirmOrder={ordId => {
                              orderStatusMutation.mutate({ id: ordId, status: 'confirmed' });
                            }}
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
      {/* 1. Campaign Modal */}
      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        campaignToEdit={campaignToEdit}
        onSave={async data => {
          await campaignMutation.mutateAsync(data);
        }}
      />

      {/* 2. Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        orderToEdit={orderToEdit}
        defaultCampaignId={orderModalCampaignId}
        campaigns={campaigns}
        onSave={async (orderData, services) => {
          await orderMutation.mutateAsync({ orderData, services });
        }}
      />

      {/* 3. Campaign Close Modal */}
      <CampaignCloseModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        campaign={campaignToClose}
        orders={orders}
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

      {/* 4. Campaign Expense Modal */}
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
      {/* Delete Campaign */}
      <ConfirmDialog
        isOpen={Boolean(campaignToDelete)}
        onClose={() => setCampaignToDelete(null)}
        onConfirm={() => {
          if (campaignToDelete) deleteCampaignMutation.mutate(campaignToDelete.id);
        }}
        title="Delete Ad Campaign"
        message={`Are you sure you want to delete campaign "${campaignToDelete?.name}" (${campaignToDelete?.campaign_code})? Any associated orders will become unassigned.`}
        confirmText="Delete Campaign"
        isDestructive
        isLoading={deleteCampaignMutation.isPending}
      />

      {/* Delete Order */}
      <ConfirmDialog
        isOpen={Boolean(orderToDelete)}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => {
          if (orderToDelete) deleteOrderMutation.mutate(orderToDelete.id);
        }}
        title="Delete Order"
        message={`Are you sure you want to delete order "${orderToDelete?.order_name}" (${orderToDelete?.order_number})?`}
        confirmText="Delete Order"
        isDestructive
        isLoading={deleteOrderMutation.isPending}
      />

      {/* Delete Expense */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) deleteExpenseMutation.mutate(expenseToDelete.id);
        }}
        title="Delete Expense"
        message={`Are you sure you want to delete this operational expense "${expenseToDelete?.description}" (${formatLKR(
          expenseToDelete?.amount_lkr || expenseToDelete?.amount
        )})?`}
        confirmText="Delete Expense"
        isDestructive
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
};
