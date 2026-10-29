import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Download,
  AlertTriangle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useErpData } from '../../context/ErpDataContext';
import { AdCampaignOrder, OrderStatus } from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csv';
import {
  OrderStatusBadge,
  CustomerPaymentBadge,
  SupplierPaymentBadge,
  IncompleteFinancialBadge,
} from '../campaigns/components/Badges';
import { OrderModal } from '../campaigns/OrderModal';
import { toast } from 'sonner';

export const OrdersPage: React.FC = () => {
  const {
    orders,
    campaigns,
    addOrder,
    updateOrder,
    deleteOrder,
    addServiceToOrder,
    deleteServiceFromOrder,
    resetToDefaultSampleData,
  } = useErpData();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Expanded row state (default expand all 3 sample orders so user immediately sees service details!)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(
    new Set(['ord-001', 'ord-002', 'ord-003'])
  );

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<AdCampaignOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<AdCampaignOrder | null>(null);

  // Inline "Add Service" state for expanded row
  const [addingServiceToOrderId, setAddingServiceToOrderId] = useState<string | null>(null);
  const [inlineServiceName, setInlineServiceName] = useState('Assembly & Testing');
  const [inlineSupplierCost, setInlineSupplierCost] = useState<number | ''>(1500);
  const [inlineMarkup, setInlineMarkup] = useState<number | ''>(1500);
  const [inlineClientPrice, setInlineClientPrice] = useState<number | ''>(3000);
  const [inlinePending, setInlinePending] = useState(false);

  // Toggle order expansion
  const toggleExpand = (orderId: string) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = order.order_name.toLowerCase().includes(term);
      const matchCust = order.customer_name?.toLowerCase().includes(term);
      if (!matchName && !matchCust) return false;
    }

    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Calculate confirmed totals
  let totalRevenue = 0;
  let totalSupplierCosts = 0;

  filteredOrders.forEach(order => {
    (order.services || []).forEach(svc => {
      if (!svc.is_financial_pending && svc.client_price !== null && svc.supplier_cost !== null) {
        totalRevenue += Number(svc.client_price) || 0;
        totalSupplierCosts += Number(svc.supplier_cost) || 0;
      }
    });
  });

  const totalGrossProfit = totalRevenue - totalSupplierCosts;

  // Export CSV
  const handleExportCsv = () => {
    const rows = filteredOrders.map(o => {
      let rev = 0;
      let cost = 0;
      (o.services || []).forEach(s => {
        if (!s.is_financial_pending && s.client_price !== null && s.supplier_cost !== null) {
          rev += Number(s.client_price) || 0;
          cost += Number(s.supplier_cost) || 0;
        }
      });
      return {
        'Order Number': o.order_number,
        'Project Name': o.order_name,
        'Customer Name': o.customer_name || 'Direct',
        'Customer Price (LKR)': rev,
        'Supplier Cost (LKR)': cost,
        'Profit (LKR)': rev - cost,
        'Order Status': o.status.toUpperCase(),
        'Payment Status': o.payment_status?.toUpperCase() || 'UNPAID',
      };
    });
    exportToCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Orders exported to CSV');
  };

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-4 md:p-8 space-y-6">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#FF8C00] flex items-center justify-center shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                Orders Management
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Horizontal table layout, service outsource costs, profit margin, and status tracking.
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
              toast.success('Reset to 3 sample orders');
            }}
          >
            Reset Sample Data
          </Button>

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
            + Add Order
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Total Orders
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-neutral-900">{orders.length}</span>
            <span className="text-xs text-neutral-400">Projects</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Sample customer projects</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Confirmed Customer Price
          </span>
          <div className="text-base font-bold font-mono text-neutral-900 mt-1 truncate">
            {formatLKR(totalRevenue)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Gross order revenue</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Total Supplier Cost
          </span>
          <div className="text-base font-bold font-mono text-neutral-700 mt-1 truncate">
            {formatLKR(totalSupplierCosts)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Outsourced PCB printing & design</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs bg-orange-50/20">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Expected Gross Profit
          </span>
          <div className="text-base font-bold font-mono text-[#FF8C00] mt-1 truncate">
            {formatLKR(totalGrossProfit)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Customer Price − Supplier Cost</p>
        </div>
      </div>

      {/* 3. Search and Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search project name or customer..."
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
              onClick={() => setStatusFilter('confirmed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Confirmed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('quotation_pending')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'quotation_pending'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Pending Quote
            </button>
          </div>
        </div>
      </div>

      {/* 4. Horizontal Table with Expandable Rows */}
      <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-100/90 text-neutral-700 font-bold uppercase border-b border-neutral-200 text-[11px]">
              <th className="w-8 px-2 py-3 text-center"></th>
              <th className="px-3 py-3">Project Name</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Order Status</th>
              <th className="px-3 py-3">Payment Status</th>
              <th className="px-3 py-3 text-right font-bold">Customer Price</th>
              <th className="px-3 py-3 text-right">Supplier Cost</th>
              <th className="px-3 py-3 text-right font-extrabold">Profit</th>
              <th className="px-3 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredOrders.map(order => {
              const isExpanded = expandedOrderIds.has(order.id);

              let confirmedCustomerPrice = 0;
              let confirmedSupplierCost = 0;
              let hasPendingServices = false;

              (order.services || []).forEach(svc => {
                if (svc.is_financial_pending || svc.client_price === null || svc.supplier_cost === null) {
                  hasPendingServices = true;
                } else {
                  confirmedCustomerPrice += Number(svc.client_price) || 0;
                  confirmedSupplierCost += Number(svc.supplier_cost) || 0;
                }
              });

              const confirmedProfit = confirmedCustomerPrice - confirmedSupplierCost;

              return (
                <React.Fragment key={order.id}>
                  {/* Parent Row */}
                  <tr
                    className={`hover:bg-neutral-50/80 transition-colors cursor-pointer ${
                      isExpanded ? 'bg-orange-50/20 font-medium' : ''
                    }`}
                    onClick={() => toggleExpand(order.id)}
                  >
                    {/* Expand Chevron */}
                    <td className="px-2 py-3.5 text-center text-neutral-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#FF8C00]" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </td>

                    {/* Project Name */}
                    <td className="px-3 py-3.5">
                      <div className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5">
                        <span>{order.order_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-neutral-500 font-semibold">
                          {order.order_number}
                        </span>
                        <span className="text-[10px] text-neutral-400">•</span>
                        <span className="text-[10px] text-neutral-500">
                          {formatDate(order.order_date)}
                        </span>
                      </div>
                      {hasPendingServices && (
                        <div className="mt-1">
                          <IncompleteFinancialBadge size="sm" />
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-3.5 whitespace-nowrap text-neutral-700">
                      <div>{order.customer_name || 'Direct Client'}</div>
                      {order.customer_phone && (
                        <span className="text-[10px] text-neutral-400 font-mono">{order.customer_phone}</span>
                      )}
                    </td>

                    {/* Order Status */}
                    <td className="px-3 py-3.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
                        <OrderStatusBadge status={order.status} size="sm" />
                        <select
                          className="text-[10px] rounded border border-neutral-200 p-0.5 bg-white text-neutral-700 w-28"
                          value={order.status}
                          onChange={e =>
                            updateOrder(order.id, { status: e.target.value as OrderStatus })
                          }
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="quotation_pending">Quotation Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <CustomerPaymentBadge status={order.payment_status} size="sm" />
                    </td>

                    {/* Customer Price */}
                    <td className="px-3 py-3.5 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                      {hasPendingServices ? (
                        <div>
                          <span className="text-neutral-900">{formatLKR(confirmedCustomerPrice)}</span>
                          <span className="text-[10px] text-amber-600 block font-normal">(+ Pending)</span>
                        </div>
                      ) : (
                        formatLKR(confirmedCustomerPrice)
                      )}
                    </td>

                    {/* Supplier Cost */}
                    <td className="px-3 py-3.5 text-right font-mono text-neutral-600 whitespace-nowrap">
                      {hasPendingServices ? (
                        <div>
                          <span>{formatLKR(confirmedSupplierCost)}</span>
                          <span className="text-[10px] text-amber-600 block font-normal">(+ Pending)</span>
                        </div>
                      ) : (
                        formatLKR(confirmedSupplierCost)
                      )}
                    </td>

                    {/* Profit */}
                    <td className="px-3 py-3.5 text-right font-mono font-extrabold whitespace-nowrap">
                      {hasPendingServices ? (
                        <div>
                          <span className="text-[#FF8C00]">{formatLKR(confirmedProfit)}</span>
                          <span className="text-[10px] text-amber-600 block font-normal">(Confirmed)</span>
                        </div>
                      ) : (
                        <span className="text-[#FF8C00]">{formatLKR(confirmedProfit)}</span>
                      )}
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

                  {/* Expanded Row: Service Line Items Breakdown */}
                  {isExpanded && (
                    <tr className="bg-neutral-50/70">
                      <td colSpan={9} className="p-4 md:p-5 border-b border-neutral-200">
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-[#FF8C00]" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                                Service Details for {order.order_name}
                              </h4>
                            </div>

                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<Plus className="w-3.5 h-3.5" />}
                              onClick={() => setAddingServiceToOrderId(order.id)}
                            >
                              + Add Service
                            </Button>
                          </div>

                          {/* Services Breakdown Table */}
                          <div className="w-full overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-neutral-100/90 text-neutral-600 uppercase font-bold text-[10px] border-b border-neutral-200">
                                  <th className="py-2 px-3">Service Name</th>
                                  <th className="py-2 px-3">Supplier Type</th>
                                  <th className="py-2 px-3 text-right">Supplier Cost</th>
                                  <th className="py-2 px-3 text-right">Profit / Margin</th>
                                  <th className="py-2 px-3 text-right font-bold">Customer Price</th>
                                  <th className="py-2 px-3 text-center">Status</th>
                                  <th className="py-2 px-3 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100">
                                {(order.services || []).map((service, sIdx) => (
                                  <tr key={service.id} className="hover:bg-neutral-50/60">
                                    <td className="py-2.5 px-3 font-semibold text-neutral-900">
                                      {service.service_name}
                                    </td>
                                    <td className="py-2.5 px-3 text-neutral-600 capitalize">
                                      {service.supplier_type === 'in_house' ? 'In-house' : 'Outsourced'}
                                    </td>

                                    {/* Supplier Cost */}
                                    <td className="py-2.5 px-3 text-right font-mono">
                                      {service.is_financial_pending || service.supplier_cost === null ? (
                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px]">
                                          Pending
                                        </span>
                                      ) : (
                                        formatLKR(service.supplier_cost)
                                      )}
                                    </td>

                                    {/* Profit */}
                                    <td className="py-2.5 px-3 text-right font-mono text-[#FF8C00] font-semibold">
                                      {service.is_financial_pending || service.markup === null ? (
                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px]">
                                          Not Confirmed
                                        </span>
                                      ) : (
                                        formatLKR(service.markup)
                                      )}
                                    </td>

                                    {/* Customer Price */}
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                                      {service.is_financial_pending || service.client_price === null ? (
                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px]">
                                          Pending
                                        </span>
                                      ) : (
                                        formatLKR(service.client_price)
                                      )}
                                    </td>

                                    {/* Status */}
                                    <td className="py-2.5 px-3 text-center">
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 capitalize">
                                        {service.service_status || 'Active'}
                                      </span>
                                    </td>

                                    {/* Action */}
                                    <td className="py-2.5 px-3 text-center">
                                      {(order.services || []).length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => deleteServiceFromOrder(order.id, service.id)}
                                          className="text-neutral-400 hover:text-red-600 p-1 rounded"
                                          title="Delete service item"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Inline Add Service Form */}
                          {addingServiceToOrderId === order.id && (
                            <div className="p-3.5 bg-white rounded-xl border border-orange-200 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                                  <Plus className="w-3.5 h-3.5 text-[#FF8C00]" /> Add New Service to {order.order_name}
                                </span>
                                <label className="flex items-center gap-1 text-[11px] text-neutral-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={inlinePending}
                                    onChange={e => setInlinePending(e.target.checked)}
                                    className="rounded text-[#FF8C00]"
                                  />
                                  <span>Pending Cost Confirmation</span>
                                </label>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                                    Service Name *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. PCB Printing"
                                    className="w-full text-xs rounded border border-neutral-200 p-2"
                                    value={inlineServiceName}
                                    onChange={e => setInlineServiceName(e.target.value)}
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                                    Supplier Cost (LKR)
                                  </label>
                                  <input
                                    type="number"
                                    placeholder={inlinePending ? 'Pending' : '0.00'}
                                    disabled={inlinePending}
                                    className="w-full text-xs rounded border border-neutral-200 p-2 font-mono disabled:bg-neutral-100"
                                    value={inlinePending ? '' : inlineSupplierCost}
                                    onChange={e => {
                                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                      setInlineSupplierCost(val);
                                      if (typeof val === 'number') {
                                        const m = inlineMarkup === '' ? 0 : Number(inlineMarkup);
                                        setInlineClientPrice(val + m);
                                      }
                                    }}
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                                    Profit / Margin (LKR)
                                  </label>
                                  <input
                                    type="number"
                                    placeholder={inlinePending ? 'Pending' : '0.00'}
                                    disabled={inlinePending}
                                    className="w-full text-xs rounded border border-neutral-200 p-2 font-mono disabled:bg-neutral-100"
                                    value={inlinePending ? '' : inlineMarkup}
                                    onChange={e => {
                                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                      setInlineMarkup(val);
                                      if (typeof val === 'number') {
                                        const c = inlineSupplierCost === '' ? 0 : Number(inlineSupplierCost);
                                        setInlineClientPrice(c + val);
                                      }
                                    }}
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                                    Customer Price (LKR)
                                  </label>
                                  <input
                                    type="number"
                                    placeholder={inlinePending ? 'Pending' : '0.00'}
                                    disabled={inlinePending}
                                    className="w-full text-xs rounded border border-neutral-200 p-2 font-mono font-bold text-neutral-900 disabled:bg-neutral-100"
                                    value={inlinePending ? '' : inlineClientPrice}
                                    onChange={e => setInlineClientPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={() => setAddingServiceToOrderId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  type="button"
                                  onClick={() => {
                                    if (!inlineServiceName.trim()) {
                                      toast.error('Please enter service name');
                                      return;
                                    }
                                    addServiceToOrder(order.id, {
                                      service_name: inlineServiceName.trim(),
                                      supplier_type: 'outsourced',
                                      supplier_cost: inlinePending || inlineSupplierCost === '' ? null : Number(inlineSupplierCost),
                                      markup: inlinePending || inlineMarkup === '' ? null : Number(inlineMarkup),
                                      client_price: inlinePending || inlineClientPrice === '' ? null : Number(inlineClientPrice),
                                      is_financial_pending: inlinePending,
                                      supplier_payment_status: 'unpaid',
                                      customer_payment_status: 'unpaid',
                                      service_status: 'pending',
                                      notes: null,
                                    });
                                    setAddingServiceToOrderId(null);
                                    toast.success('Service added to order');
                                  }}
                                >
                                  Save Service Item
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Modal (Add / Edit) */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        orderToEdit={orderToEdit}
        campaigns={campaigns}
        onSave={async (orderData, services) => {
          if (orderToEdit) {
            updateOrder(orderToEdit.id, { ...orderData, services: services as any });
            toast.success('Order updated');
          } else {
            addOrder({ ...orderData, services: services as any });
            toast.success('New order added');
          }
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(orderToDelete)}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => {
          if (orderToDelete) {
            deleteOrder(orderToDelete.id);
            toast.success('Order deleted');
            setOrderToDelete(null);
          }
        }}
        title="Delete Customer Order"
        message={`Are you sure you want to delete "${orderToDelete?.order_name}"?`}
        confi