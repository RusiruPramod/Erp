import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useErpData } from '../../context/ErpDataContext';
import { AdCampaignOrder, OrderStatus, CustomerPaymentStatus } from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csv';
import {
  OrderStatusBadge,
  CustomerPaymentBadge,
  IncompleteFinancialBadge,
} from '../campaigns/components/Badges';
import { OrderModal } from '../campaigns/OrderModal';
import { toast } from 'sonner';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    orders,
    campaigns,
    addOrder,
    updateOrder,
    deleteOrder,
    resetToDefaultSampleData,
  } = useErpData();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<AdCampaignOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<AdCampaignOrder | null>(null);

  // Quick Input Shell Row state (reusable row right below search filter)
  const quickProjectNameRef = useRef<HTMLInputElement>(null);
  const [quickProjectName, setQuickProjectName] = useState('');
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickOrderStatus, setQuickOrderStatus] = useState<OrderStatus>('confirmed');
  const [quickPaymentStatus, setQuickPaymentStatus] = useState<CustomerPaymentStatus>('unpaid');
  const [quickCustomerPrice, setQuickCustomerPrice] = useState<number | ''>('');
  const [quickSupplierCost, setQuickSupplierCost] = useState<number | ''>('');

  const quickProfit =
    (quickCustomerPrice === '' ? 0 : Number(quickCustomerPrice)) -
    (quickSupplierCost === '' ? 0 : Number(quickSupplierCost));

  const handleQuickAddOrder = () => {
    if (!quickProjectName.trim()) {
      toast.error('Please enter a Project Name');
      quickProjectNameRef.current?.focus();
      return;
    }

    const year = new Date().getFullYear();
    let count = orders.length + 1;
    let newOrderNumber = `ORD-${year}-${String(count).padStart(3, '0')}`;
    const existingNumbers = new Set(orders.map(o => o.order_number));
    while (existingNumbers.has(newOrderNumber)) {
      count++;
      newOrderNumber = `ORD-${year}-${String(count).padStart(3, '0')}`;
    }

    const custPrice = quickCustomerPrice === '' ? 0 : Number(quickCustomerPrice);
    const suppCost = quickSupplierCost === '' ? 0 : Number(quickSupplierCost);
    const profit = custPrice - suppCost;
    const today = new Date().toISOString().slice(0, 10);

    const newOrder: Omit<AdCampaignOrder, 'id' | 'created_at' | 'updated_at'> = {
      order_number: newOrderNumber,
      order_name: quickProjectName.trim(),
      customer_name: quickCustomerName.trim() || null,
      customer_phone: null,
      order_date: today,
      campaign_id: campaigns[0]?.id || null,
      lead_source: 'Manual Entry',
      status: quickOrderStatus,
      payment_status: quickPaymentStatus,
      customer_paid_amount: quickPaymentStatus === 'fully_paid' ? custPrice : 0,
      supplier_payment_status: suppCost > 0 ? 'unpaid' : 'fully_paid',
      supplier_paid_amount: 0,
      notes: 'Quick added via orders shell row.',
      services: [
        {
          id: `svc-${Date.now()}`,
          order_id: '',
          position: 1,
          service_name: `${quickProjectName.trim()} Service`,
          supplier_type: 'outsourced',
          supplier_cost: suppCost,
          markup: profit,
          client_price: custPrice,
          is_financial_pending: false,
          supplier_payment_status: 'unpaid',
          customer_payment_status: quickPaymentStatus,
          service_status: quickOrderStatus === 'completed' ? 'completed' : 'in_progress',
          notes: null,
        },
      ],
    };

    addOrder(newOrder);
    toast.success(`Order "${quickProjectName.trim()}" added to table!`);

    // Reset shell row so it can be reused immediately
    setQuickProjectName('');
    setQuickCustomerName('');
    setQuickOrderStatus('confirmed');
    setQuickPaymentStatus('unpaid');
    setQuickCustomerPrice('');
    setQuickSupplierCost('');

    // Re-focus project name for next entry
    setTimeout(() => {
      quickProjectNameRef.current?.focus();
    }, 50);
  };

  const handleResetQuickRow = () => {
    setQuickProjectName('');
    setQuickCustomerName('');
    setQuickOrderStatus('confirmed');
    setQuickPaymentStatus('unpaid');
    setQuickCustomerPrice('');
    setQuickSupplierCost('');
  };

  const handleQuickKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickAddOrder();
    }
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
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              All ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('confirmed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${statusFilter === 'confirmed'
                  ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              Confirmed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('quotation_pending')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${statusFilter === 'quotation_pending'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              Pending Quote
            </button>
          </div>
        </div>
      </div>

      {/* 3.1. Separate Quick Entry Shell Row */}
      <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF8C00] flex items-center justify-center text-xs font-bold shadow-2xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Quick Order Entry Shell
                </h3>
                <span className="text-[10px] font-bold text-[#FF8C00] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Reusable Row
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Enter order values below and click <b>+ Add</b> or press <b>Enter</b> to instantly update the table below.
              </p>
            </div>
          </div>

          {(quickProjectName ||
            quickCustomerName ||
            quickCustomerPrice !== '' ||
            quickSupplierCost !== '') && (
            <button
              type="button"
              onClick={handleResetQuickRow}
              className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              title="Clear row inputs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Row</span>
            </button>
          )}
        </div>

        {/* Input Columns Row */}
        <div className="w-full overflow-x-auto pb-1">
          <div className="min-w-[1020px] grid grid-cols-12 gap-2.5 items-end bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/90">
            {/* Project Name */}
            <div className="col-span-3">
              <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                Project Name *
              </label>
              <input
                ref={quickProjectNameRef}
                type="text"
                placeholder="Enter project name..."
                value={quickProjectName}
                onChange={e => setQuickProjectName(e.target.value)}
                onKeyDown={handleQuickKeyDown}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-2.5 py-2 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none font-medium placeholder:text-neutral-400 shadow-2xs"
              />
            </div>

            {/* Customer */}
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                Customer
              </label>
              <input
                type="text"
                placeholder="Customer name..."
                value={quickCustomerName}
                onChange={e => setQuickCustomerName(e.target.value)}
                onKeyDown={handleQuickKeyDown}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-2.5 py-2 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none placeholder:text-neutral-400 shadow-2xs"
              />
            </div>

            {/* Order Status */}
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                Order Status
              </label>
              <select
                value={quickOrderStatus}
                onChange={e => setQuickOrderStatus(e.target.value as OrderStatus)}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-2 py-2 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none text-neutral-800 shadow-2xs"
              >
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="quotation_pending">Quotation Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status */}
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1 truncate" title="Payment Status">
                Payment
              </label>
              <select
                value={quickPaymentStatus}
                onChange={e => setQuickPaymentStatus(e.target.value as CustomerPaymentStatus)}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-1.5 py-2 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none text-neutral-800 shadow-2xs"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partial</option>
                <option value="fully_paid">Fully Paid</option>
                <option value="not_invoiced">Not Invoiced</option>
              </select>
            </div>

            {/* Customer Price */}
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1 text-right truncate" title="Customer Price">
                Cust Price
              </label>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={quickCustomerPrice}
                onChange={e =>
                  setQuickCustomerPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                onKeyDown={handleQuickKeyDown}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-2 py-2 text-right font-mono font-bold focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none text-neutral-900 placeholder:text-neutral-400 shadow-2xs"
              />
            </div>

            {/* Supplier Cost */}
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1 text-right truncate" title="Supplier Cost">
                Supp Cost
              </label>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={quickSupplierCost}
                onChange={e =>
                  setQuickSupplierCost(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                onKeyDown={handleQuickKeyDown}
                className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-2 py-2 text-right font-mono focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none text-neutral-700 placeholder:text-neutral-400 shadow-2xs"
              />
            </div>

            {/* Profit */}
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1 text-right truncate">
                Profit
              </label>
              <div className="h-[38px] flex items-center justify-end px-2 text-right font-mono font-extrabold text-xs whitespace-nowrap bg-white rounded-lg border border-neutral-200 shadow-2xs">
                <span
                  className={
                    quickProfit > 0
                      ? 'text-[#FF8C00]'
                      : quickProfit < 0
                      ? 'text-red-500'
                      : 'text-neutral-500'
                  }
                >
                  {formatLKR(quickProfit)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1 text-center truncate">
                Actions
              </label>
              <button
                type="button"
                onClick={handleQuickAddOrder}
                className="w-full h-[38px] inline-flex items-center justify-center gap-1 rounded-lg bg-[#FF8C00] hover:bg-[#e07b00] text-white text-xs font-semibold shadow-2xs transition-all active:scale-95"
                title="Add Order to table below (or press Enter)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
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
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-neutral-400">
                  No orders found matching your search.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                let confirmedCustomerPrice = 0;
                let confirmedSupplierCost = 0;
                let hasPendingServices = false;

                (order.services || []).forEach(svc => {
                  if (
                    svc.is_financial_pending ||
                    svc.client_price === null ||
                    svc.supplier_cost === null
                  ) {
                    hasPendingServices = true;
                  } else {
                    confirmedCustomerPrice += Number(svc.client_price) || 0;
                    confirmedSupplierCost += Number(svc.supplier_cost) || 0;
                  }
                });

                const confirmedProfit = confirmedCustomerPrice - confirmedSupplierCost;

                return (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                    title={`Click to view ${order.order_name} in detail page`}
                  >
                    {/* View Icon Column */}
                    <td className="px-2 py-3.5 text-center text-neutral-400 group-hover:text-[#FF8C00]">
                      <ExternalLink className="w-3.5 h-3.5 mx-auto" />
                    </td>

                    {/* Project Name */}
                    <td className="px-3 py-3.5">
                      <div className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5 group-hover:text-[#FF8C00] transition-colors">
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
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {order.customer_phone}
                        </span>
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
                          <span className="text-neutral-900">
                            {formatLKR(confirmedCustomerPrice)}
                          </span>
                          <span className="text-[10px] text-amber-600 block font-normal">
                            (+ Pending)
                          </span>
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
                          <span className="text-[10px] text-amber-600 block font-normal">
                            (+ Pending)
                          </span>
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
                          <span className="text-[10px] text-amber-600 block font-normal">
                            (Confirmed)
                          </span>
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
                );
              })
            )}
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
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};
