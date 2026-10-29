import React, { useState } from 'react';
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
  DollarSign,
  History,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useErpData } from '../../context/ErpDataContext';
import { AdCampaign, AdCampaignExpense } from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csv';
import { CampaignStatusBadge } from './components/Badges';
import { CampaignDetailSection } from './components/CampaignDetailSection';
import { CampaignModal } from './CampaignModal';
import { CampaignCloseModal } from './CampaignCloseModal';
import { CampaignExpenseModal } from './CampaignExpenseModal';
import { toast } from 'sonner';

export const AdCampaignLedgerPage: React.FC = () => {
  const {
    campaigns,
    orders,
    expenses,
    exchangeRate,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    addExpense,
    deleteExpense,
    resetToDefaultSampleData,
  } = useErpData();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Expanded row state
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>('camp-run-1');

  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<AdCampaign | null>(null);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [campaignToClose, setCampaignToClose] = useState<AdCampaign | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalCampaignId, setExpenseModalCampaignId] = useState<string>('');

  const [campaignToDelete, setCampaignToDelete] = useState<AdCampaign | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<AdCampaignExpense | null>(null);

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(term);
      const matchCode = c.campaign_code?.toLowerCase().includes(term);
      if (!matchName && !matchCode) return false;
    }

    if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Totals
  const totalAdSpendUsd = filteredCampaigns.reduce((sum, c) => sum + (Number(c.ad_spend_usd) || 0), 0);
  const totalAdSpendLkr = filteredCampaigns.reduce((sum, c) => {
    const usd = Number(c.ad_spend_usd) || 0;
    const lkr = Number(c.ad_spend_lkr) > 0 ? Number(c.ad_spend_lkr) : usd * exchangeRate;
    return sum + lkr;
  }, 0);

  // Export CSV
  const handleExportCsv = () => {
    const rows = filteredCampaigns.map(c => {
      const usd = Number(c.ad_spend_usd) || 0;
      const rate = Number(c.exchange_rate) || exchangeRate;
      const lkr = Number(c.ad_spend_lkr) > 0 ? Number(c.ad_spend_lkr) : usd * rate;
      const campOrders = orders.filter(o => o.campaign_id === c.id);

      return {
        'Campaign Code': c.campaign_code,
        'Campaign Name': c.name,
        Status: c.status.toUpperCase(),
        'Ad Spend (USD)': usd.toFixed(2),
        'Exchange Rate': rate.toFixed(2),
        'Ad Spend (LKR)': lkr.toFixed(2),
        'Orders Count': campOrders.length,
      };
    });
    exportToCsv(`ad-campaigns-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Ad Campaigns exported to CSV');
  };

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-4 md:p-8 space-y-6">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#FF8C00] flex items-center justify-center shadow-2xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                Ad Campaigns Management
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Track ad spend in USD/LKR, campaign dates, linked customer orders, and profit returns.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => {
              resetToDefaultSampleData();
              toast.success('Campaigns reset to sample data');
            }}
          >
            Reset Sample Data
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
            + New Campaign
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards for the 3 Campaigns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Historical Ad Spend Card */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Historical Ad Spend (Archived)
            </span>
            <History className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="font-mono font-bold text-xl text-neutral-900 mt-1">
            $10.24 <span className="text-xs text-neutral-500 font-normal">USD</span>
          </div>
          <p className="text-xs font-mono font-semibold text-[#FF8C00] mt-0.5">
            ≈ {formatLKR(10.24 * exchangeRate)}
          </p>
          <p className="text-[10px] text-neutral-400 mt-1.5 border-t border-neutral-100 pt-1.5">
            Consolidated 5 entries: $3.45 + $4.46 + $0.28 + $1.77 + $0.28
          </p>
        </div>

        {/* Current Campaign 1 Card */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Current Campaign 1 (Running)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="font-mono font-bold text-xl text-emerald-700 mt-1">
            $1.24 <span className="text-xs text-neutral-500 font-normal">USD</span>
          </div>
          <p className="text-xs font-mono font-semibold text-[#FF8C00] mt-0.5">
            ≈ {formatLKR(1.24 * exchangeRate)}
          </p>
          <p className="text-[10px] text-neutral-400 mt-1.5 border-t border-neutral-100 pt-1.5">
            Smart Dispensing Drug Timer Medicine
          </p>
        </div>

        {/* Current Campaign 2 Card */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Current Campaign 2 (Running)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="font-mono font-bold text-xl text-emerald-700 mt-1">
            $1.87 <span className="text-xs text-neutral-500 font-normal">USD</span>
          </div>
          <p className="text-xs font-mono font-semibold text-[#FF8C00] mt-0.5">
            ≈ {formatLKR(1.87 * exchangeRate)}
          </p>
          <p className="text-[10px] text-neutral-400 mt-1.5 border-t border-neutral-100 pt-1.5">
            Safety Helmet & Panel Hardware Inquiries
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campaign name or code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              All ({campaigns.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('running')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${statusFilter === 'running'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              Running ({campaigns.filter(c => c.status === 'running').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${statusFilter === 'archived'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              Archived ({campaigns.filter(c => c.status === 'archived').length})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Campaigns Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-100/90 text-neutral-700 font-bold uppercase border-b border-neutral-200 text-[11px]">
              <th className="w-8 px-2 py-3"></th>
              <th className="px-3 py-3">Campaign Code</th>
              <th className="px-3 py-3">Campaign Name</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Ad Spend (USD)</th>
              <th className="px-3 py-3 text-right font-bold">Ad Spend (LKR)</th>
              <th className="px-3 py-3 text-right">Linked Orders</th>
              <th className="px-3 py-3 text-right font-bold">Orders Profit</th>
              <th className="px-3 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredCampaigns.map(campaign => {
              const isExpanded = expandedCampaignId === campaign.id;
              const usd = Number(campaign.ad_spend_usd) || 0;
              const rate = Number(campaign.exchange_rate) || exchangeRate;
              const lkr = Number(campaign.ad_spend_lkr) > 0 ? Number(campaign.ad_spend_lkr) : usd * rate;

              // Linked orders and their profit
              const linkedOrders = orders.filter(o => o.campaign_id === campaign.id);
              let campaignProfit = 0;
              linkedOrders.forEach(o => {
                let rev = 0;
                let cost = 0;
                (o.services || []).forEach(s => {
                  if (!s.is_financial_pending && s.client_price !== null && s.supplier_cost !== null) {
                    rev += Number(s.client_price) || 0;
                    cost += Number(s.supplier_cost) || 0;
                  }
                });
                campaignProfit += (rev - cost);
              });

              return (
                <React.Fragment key={campaign.id}>
                  <tr
                    className={`hover:bg-neutral-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-orange-50/20 font-medium' : ''
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

                    {/* Campaign Name */}
                    <td className="px-3 py-3.5">
                      <div className="font-semibold text-neutral-900 text-xs">
                        {campaign.name}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Started: {formatDate(campaign.start_date)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <CampaignStatusBadge status={campaign.status} size="sm" />
                    </td>

                    {/* Ad Spend (USD) */}
                    <td className="px-3 py-3.5 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                      ${usd.toFixed(2)} USD
                    </td>

                    {/* Ad Spend (LKR) */}
                    <td className="px-3 py-3.5 text-right font-mono font-bold text-[#FF8C00] whitespace-nowrap">
                      {formatLKR(lkr)}
                    </td>

                    {/* Linked Orders */}
                    <td className="px-3 py-3.5 text-right font-mono whitespace-nowrap">
                      <span className="font-semibold">{linkedOrders.length}</span> orders
                    </td>

                    {/* Orders Profit */}
                    <td className="px-3 py-3.5 text-right font-mono font-extrabold text-emerald-700 whitespace-nowrap">
                      {campaignProfit > 0 ? formatLKR(campaignProfit) : '-'}
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
                          title="Settle ad spend and close"
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

                  {/* Expanded Section */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="p-0 border-b border-neutral-200">
                        <CampaignDetailSection
                          campaign={campaign}
                          orders={orders}
                          expenses={expenses}
                          onAddExpense={cId => {
                            setExpenseModalCampaignId(cId);
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

      {/* Campaign Create/Edit Modal */}
      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        campaignToEdit={campaignToEdit}
        onSave={async data => {
          if (campaignToEdit) {
            updateCampaign(campaignToEdit.id, data);
            toast.success('Campaign updated');
          } else {
            addCampaign(data);
            toast.success('New campaign started');
          }
        }}
      />

      {/* Settle Spend & Close Campaign Modal */}
      <CampaignCloseModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        campaign={campaignToClose}
        orders={orders}
        expenses={expenses}
        onSaveAndClose={async (campaignId, updates, newExpenses) => {
          updateCampaign(campaignId, updates);
          if (newExpenses && newExpenses.length > 0) {
            newExpenses.forEach(exp => addExpense({ ...exp, campaign_id: campaignId }));
          }
          toast.success('Campaign settled & updated');
        }}
        onOpenAddExpenseModal={() => {
          if (campaignToClose) {
            setExpenseModalCampaignId(campaignToClose.id);
            setIsExpenseModalOpen(true);
          }
        }}
      />

      {/* Campaign Expense Modal */}
      <CampaignExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        campaignId={expenseModalCampaignId}
        campaigns={campaigns}
        orders={orders}
        onSave={async data => {
          addExpense(data);
          toast.success('Expense recorded');
        }}
      />

      {/* Delete Campaign Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(campaignToDelete)}
        onClose={() => setCampaignToDelete(null)}
        onConfirm={() => {
          if (campaignToDelete) {
            deleteCampaign(campaignToDelete.id);
            toast.success('Campaign deleted');
            setCampaignToDelete(null);
          }
        }}
        title="Delete Ad Campaign"
        message={`Are you sure you want to delete campaign "${campaignToDelete?.name}"?`}
        confirmText="Delete"
        isDestructive
      />

      {/* Delete Expense Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
            toast.success('Expense deleted');
            setExpenseToDelete(null);
          }
        }}
        title="Delete Expense"
        message={`Are you sure you want to delete expense "${expenseToDelete?.description}"?`}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};
