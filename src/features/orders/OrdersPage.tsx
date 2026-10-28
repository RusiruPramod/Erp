import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Plus,
  Search,
  Download,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  Megaphone,
  User,
  Phone,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { adCampaignService } from '../../services/adCampaignService';
import { calculateOrderFinancials } from '../../services/adCalculations';
import {
  AdCampaign,
  AdCampaignOrder,
  OrderStatus,
} from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csv';
import { OrderStatusBadge, IncompleteFinancialBadge } from '../campaigns/components/Badges';
import { OrderModal } from '../campaigns/OrderModal';
import { toast } from 'sonner';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');

  // Modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<AdCampaignOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<AdCampaignOrder | null>(null);

  // Queries
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<AdCampaignOrder[]>({
    queryKey: ['ad-orders'],
    queryFn: () => adCampaignService.getOrders(),
  });

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<AdCampaign[]>({
    queryKey: ['ad-campaigns'],
    queryFn: () => adCampaignService.getCampaigns(),
  });

  const isLoading = isLoadingOrders || isLoadingCampaigns;

  // Mutations
  const orderMutation = useMutation({
    mutationFn: async ({ orderData, services }: { orderData: any; services: any[] }) => {
      if (orderToEdit) {
        return adCampaignService.updateOrder(orderToEdit.id, orderData, services);
      }
      return adCampaignService.createOrder(orderData, services);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-orders'] });
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      toast.success(orderToEdit ? 'Order updated' : 'New order recorded');
    },
    onError: err => {
      toast.error('Failed to save order: ' + (err as Error).message);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => adCampaignService.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-orders'] });
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
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
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      toast.success('Order status updated');
    },
  });

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = order.order_name.toLowerCase().includes(term);
      const matchNum = order.order_number.toLowerCase().includes(term);
      const matchCust = order.customer_name?.toLowerCase().includes(term);
      const matchPhone = order.customer_phone?.toLowerCase().includes(term);
      if (!matchName && !matchNum && !matchCust && !matchPhone) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }

    // Campaign filter
    if (campaignFilter !== 'all') {
      if (campaignFilter === 'no_campaign') {
        if (order.campaign_id !== null) return false;
      } else {
        if (order.campaign_id !== campaignFilter) return false;
      }
    }

    return true;
  });

  // Calculate top KPI numbers for orders
  let totalRevenue = 0;
  let totalSupplierCosts = 0;
  let confirmedCount = 0;
  let pendingCount = 0;
  let incompleteCount = 0;

  filteredOrders.forEach(order => {
    const fin = calculateOrderFinancials(order, 0, 0);
    if (fin.has_incomplete_financials) incompleteCount += 1;

    if (fin.is_confirmed) {
      confirmedCount += 1;
      totalRevenue += fin.revenue;
      totalSupplierCosts += fin.supplier_costs;
    } else if (order.status === 'pending') {
      pendingCount += 1;
    }
  });

  const grossProfit = totalRevenue - totalSupplierCosts;

  // Export CSV
  const handleExportCsv = () => {
    const rows = filteredOrders.map(o => {
      const fin = calculateOrderFinancials(o, 0, 0);
      const camp = campaigns.find(c => c.id === o.campaign_id);
      return {
        'Order Number': o.order_number,
        'Order Name': o.order_name,
        'Customer Name': o.customer_name || 'Direct',
        'Customer Phone': o.customer_phone || '',
        'Order Date': o.order_date,
        Status: o.status.toUpperCase(),
        'Ad Campaign': camp ? `${camp.campaign_code} - ${camp.name}` : 'No Campaign (Direct)',
        'Revenue (LKR)': fin.revenue,
        'Supplier Costs (LKR)': fin.supplier_costs,
        'Gross Profit (LKR)': fin.gross_profit,
        'Incomplete Pricing': fin.has_incomplete_financials ? 'YES' : 'NO',
        Services: (o.services || []).map(s => `${s.service_name} (${formatLKR(s.client_price)})`).join('; '),
      };
    });
    exportToCsv(`customer-orders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Orders exported to CSV');
  };

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-4 md:p-8">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF8C00] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              Orders & Customer Inquiries
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Daily order recording, customer inquiries, service line items, and supplier cost tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
            disabled={filteredOrders.length === 0}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setOrderToEdit(null);
              setIsOrderModalOpen(true);
            }}
          >
            + Add New Order
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Total Orders
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold font-mono text-neutral-900">
              {filteredOrders.length}
            </span>
            <span className="text-xs text-neutral-400">orders</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Across all campaigns & direct</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Confirmed Orders
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-bold font-mono text-blue-700">
              {confirmedCount}
            </span>
            {pendingCount > 0 && (
              <span className="text-xs font-semibold text-amber-600">
                (+{pendingCount} inquiries)
              </span>
            )}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Active & ready to deliver</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Confirmed Revenue
          </span>
          <div className="text-base font-bold font-mono text-neutral-900 mt-1 truncate">
            {formatLKR(totalRevenue)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">From confirmed orders</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Total Supplier Costs
          </span>
          <div className="text-base font-bold font-mono text-neutral-700 mt-1 truncate">
            {formatLKR(totalSupplierCosts)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">PCB fabrication & parts</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs bg-orange-50/20">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Order Gross Profit
          </span>
          <div className="text-base font-bold font-mono text-[#FF8C00] mt-1 truncate">
            {formatLKR(grossProfit)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Revenue − Supplier Costs</p>
        </div>
      </div>

      {incompleteCount > 0 && (
        <div className="mb-4 flex items-center gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>{incompleteCount} order(s) have incomplete supplier pricing:</strong> Pending supplier
            quotes are excluded from confirmed revenue to prevent inaccurate accounting.
          </span>
        </div>
      )}

      {/* 3. Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search order title, customer name, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00]"
          />
        </div>

        {/* Filter dropdowns */}
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
              All ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Clock className="w-3 h-3" />
              Inquiries ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('confirmed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Confirmed ({orders.filter(o => o.status === 'confirmed').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Completed ({orders.filter(o => o.status === 'completed').length})
            </button>
          </div>

          {/* Campaign Filter */}
          <div className="w-48">
            <select
              className="text-xs w-full rounded-lg border border-neutral-200 p-2 bg-white text-neutral-700 truncate"
              value={campaignFilter}
              onChange={e => setCampaignFilter(e.target.value)}
            >
              <option value="all">All Campaigns</option>
              <option value="no_campaign">No Campaign (Direct / Friends)</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.campaign_code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Orders Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-[#FF8C00]" />}
          title="No customer orders found"
          description="Record confirmed customer orders or pending inquiries to track revenue and service costs."
          actionLabel="+ Add New Order"
          onAction={() => {
            setOrderToEdit(null);
            setIsOrderModalOpen(true);
          }}
        />
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/90 text-neutral-700 font-bold uppercase border-b border-neutral-200 text-[11px]">
                <th className="px-3 py-3">Order / Project</th>
                <th className="px-3 py-3">Customer & Contact</th>
                <th className="px-3 py-3">Campaign Association</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Services List</th>
                <th className="px-3 py-3 text-right">Revenue</th>
                <th className="px-3 py-3 text-right">Supplier Costs</th>
                <th className="px-3 py-3 text-right font-extrabold">Gross Profit</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredOrders.map(order => {
                const fin = calculateOrderFinancials(order, 0, 0);
                const assignedCampaign = campaigns.find(c => c.id === order.campaign_id);

                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-neutral-50/80 transition-colors ${
                      order.status === 'pending'
                        ? 'bg-amber-50/25'
                        : fin.has_incomplete_financials
                        ? 'bg-rose-50/20'
                        : ''
                    }`}
                  >
                    {/* Order Title & ID */}
                    <td className="px-3 py-3.5 align-top">
                      <div className="font-semibold text-neutral-900 text-xs">
                        {order.order_name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-neutral-500">
                          {order.order_number}
                        </span>
                        <span className="text-[10px] text-neutral-400">•</span>
                        <span className="text-[10px] text-neutral-500">
                          {formatDate(order.order_date)}
                        </span>
                      </div>
                      {fin.has_incomplete_financials && (
                        <div className="mt-1">
                          <IncompleteFinancialBadge size="sm" />
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-3.5 align-top whitespace-nowrap">
                      <div className="font-medium text-neutral-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-neutral-400" />
                        <span>{order.customer_name || 'Direct / Anonymous'}</span>
                      </div>
                      {order.customer_phone && (
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{order.customer_phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Campaign Association */}
                    <td className="px-3 py-3.5 align-top">
                      {assignedCampaign ? (
                        <div className="max-w-[180px]">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-[#CC7000] border border-orange-200">
                            <Megaphone className="w-3 h-3" />
                            {assignedCampaign.campaign_code}
                          </span>
                          <p className="text-[11px] text-neutral-700 truncate mt-0.5">
                            {assignedCampaign.name}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                          Direct (No Campaign)
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5 align-top whitespace-nowrap">
                      <OrderStatusBadge status={order.status} size="sm" />
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() =>
                            orderStatusMutation.mutate({ id: order.id, status: 'confirmed' })
                          }
                          className="block mt-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 underline"
                        >
                          Mark Confirmed
                        </button>
                      )}
                    </td>

                    {/* Services Breakdown */}
                    <td className="px-3 py-3.5 align-top">
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
                              <span className="text-[10px] text-amber-600 font-medium">Quote pending</span>
                            ) : (
                              <span className="font-mono text-[10px] text-neutral-600">
                                {formatLKR(svc.client_price)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="px-3 py-3.5 align-top text-right font-mono font-medium text-neutral-900 whitespace-nowrap">
                      {order.status === 'pending' ? (
                        <span className="text-neutral-400" title="Pending inquiry">
                          ({formatLKR(fin.revenue)})
                        </span>
                      ) : (
                        formatLKR(fin.revenue)
                      )}
                    </td>

                    {/* Supplier Costs */}
                    <td className="px-3 py-3.5 align-top text-right font-mono text-neutral-600 whitespace-nowrap">
                      {order.status === 'pending' ? (
                        <span className="text-neutral-400">({formatLKR(fin.supplier_costs)})</span>
                      ) : (
                        formatLKR(fin.supplier_costs)
                      )}
                    </td>

                    {/* Gross Profit */}
                    <td className="px-3 py-3.5 align-top text-right font-mono font-bold whitespace-nowrap">
                      {order.status === 'pending' ? (
                        <span className="text-neutral-400 font-normal">Pending</span>
                      ) : (
                        <span
                          className={fin.gross_profit >= 0 ? 'text-[#FF8C00]' : 'text-rose-600'}
                        >
                          {formatLKR(fin.gross_profit)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3.5 align-top text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setOrderToEdit(order);
                            setIsOrderModalOpen(true);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                          title="Edit Order"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(order)}
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

      {/* Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        orderToEdit={orderToEdit}
        campaigns={campaigns}
        onSave={async (orderData, services) => {
          await orderMutation.mutateAsync({ orderData, services });
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(orderToDelete)}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => {
          if (orderToDelete) deleteOrderMutation.mutate(orderToDelete.id);
        }}
        title="Delete Customer Order"
        message={`Are you sure you want to delete order "${orderToDelete?.order_name}" (${orderToDelete?.order_number})?`}
        confirmText="Delete Order"
        isDestructive
        isLoading={deleteOrderMutation.isPending}
      />
    </div>
  );
};
