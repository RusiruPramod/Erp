import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Calendar,
  User,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useErpData } from '../../context/ErpDataContext';
import { OrderStatus, CustomerPaymentStatus } from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import {
  OrderStatusBadge,
  CustomerPaymentBadge,
  IncompleteFinancialBadge,
} from '../campaigns/components/Badges';
import { OrderModal } from '../campaigns/OrderModal';
import { toast } from 'sonner';

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const {
    orders,
    campaigns,
    updateOrder,
    deleteOrder,
    addServiceToOrder,
    deleteServiceFromOrder,
  } = useErpData();

  const order = orders.find(o => o.id === orderId);

  // Modal / Dialog states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);

  // Inline "Add Service" form state
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [supplierType, setSupplierType] = useState<'outsourced' | 'in_house'>('outsourced');
  const [supplierCost, setSupplierCost] = useState<number | ''>('');
  const [markup, setMarkup] = useState<number | ''>('');
  const [clientPrice, setClientPrice] = useState<number | ''>('');
  const [isPending, setIsPending] = useState(false);

  if (!order) {
    return (
      <div className="h-full w-full bg-white p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF8C00] flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Order Not Found</h2>
        <p className="text-sm text-neutral-500 max-w-md">
          The requested order (ID: {orderId}) could not be found or may have been deleted.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/orders')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  // Calculate totals
  let totalRevenue = 0;
  let totalSupplierCosts = 0;
  let hasPendingServices = false;

  (order.services || []).forEach(svc => {
    if (svc.is_financial_pending || svc.client_price === null || svc.supplier_cost === null) {
      hasPendingServices = true;
    } else {
      totalRevenue += Number(svc.client_price) || 0;
      totalSupplierCosts += Number(svc.supplier_cost) || 0;
    }
  });

  const totalGrossProfit = totalRevenue - totalSupplierCosts;
  const profitMarginPercent = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  // Handle adding service
  const handleSaveService = () => {
    if (!serviceName.trim()) {
      toast.error('Please enter a service name');
      return;
    }

    const suppCostNum = isPending || supplierCost === '' ? null : Number(supplierCost);
    const markupNum = isPending || markup === '' ? null : Number(markup);
    const clientPriceNum = isPending || clientPrice === '' ? null : Number(clientPrice);

    addServiceToOrder(order.id, {
      service_name: serviceName.trim(),
      supplier_type: supplierType,
      supplier_cost: suppCostNum,
      markup: markupNum,
      client_price: clientPriceNum,
      is_financial_pending: isPending,
      supplier_payment_status: 'unpaid',
      customer_payment_status: 'unpaid',
      service_status: 'pending',
      notes: null,
    });

    toast.success('Service item added to order');
    setIsAddingService(false);
    setServiceName('');
    setSupplierCost('');
    setMarkup('');
    setClientPrice('');
    setIsPending(false);
  };

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-4 md:p-8 space-y-6">
      {/* 1. Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Orders
          </Button>

          <div className="h-4 w-px bg-neutral-200" />

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
              {order.order_number}
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs text-neutral-500">{formatDate(order.order_date)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Order
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* 2. Order Profile Header */}
      <div className="bg-neutral-50/70 border border-neutral-200/90 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 text-[#FF8C00] flex items-center justify-center shrink-0 shadow-2xs">
              <ShoppingBag className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                  {order.order_name}
                </h1>
                {hasPendingServices && <IncompleteFinancialBadge size="md" />}
              </div>

              <div className="flex items-center gap-4 flex-wrap mt-2 text-xs text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-medium text-neutral-800">
                    {order.customer_name || 'Direct Client'}
                  </span>
                </div>

                {order.customer_phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-mono text-neutral-600">{order.customer_phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Ordered: {formatDate(order.order_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Controls */}
          <div className="flex items-center gap-3 flex-wrap lg:justify-end">
            <div className="bg-white px-3 py-2 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block">
                Order Status
              </span>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} size="sm" />
                <select
                  className="text-xs rounded border border-neutral-200 p-1 bg-white text-neutral-800 font-medium"
                  value={order.status}
                  onChange={e => updateOrder(order.id, { status: e.target.value as OrderStatus })}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="quotation_pending">Quotation Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="bg-white px-3 py-2 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block">
                Payment Status
              </span>
              <div className="flex items-center gap-2">
                <CustomerPaymentBadge status={order.payment_status} size="sm" />
                <select
                  className="text-xs rounded border border-neutral-200 p-1 bg-white text-neutral-800 font-medium"
                  value={order.payment_status || 'unpaid'}
                  onChange={e =>
                    updateOrder(order.id, {
                      payment_status: e.target.value as CustomerPaymentStatus,
                    })
                  }
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                  <option value="not_invoiced">Not Invoiced</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="text-xs text-neutral-600 bg-white p-3 rounded-xl border border-neutral-200/80">
            <span className="font-bold text-neutral-700">Notes: </span>
            {order.notes}
          </div>
        )}
      </div>

      {/* 3. Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Customer Price (Revenue)
          </span>
          <div className="text-base font-bold font-mono text-neutral-900 mt-1">
            {formatLKR(totalRevenue)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Total bill to customer</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Supplier Outsourcing Cost
          </span>
          <div className="text-base font-bold font-mono text-neutral-700 mt-1">
            {formatLKR(totalSupplierCosts)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">PCB printing, fabrication</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs bg-orange-50/30">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Net Gross Profit
          </span>
          <div className="text-base font-bold font-mono text-[#FF8C00] mt-1">
            {formatLKR(totalGrossProfit)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Customer Price − Supplier Cost</p>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Profit Margin
          </span>
          <div className="text-base font-bold font-mono text-emerald-600 mt-1">
            {profitMarginPercent.toFixed(1)}%
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Gross margin on this project</p>
        </div>
      </div>

      {/* 4. Service Breakdown Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF8C00]" />
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Project Services & Line Items Table
            </h3>
            <span className="text-xs text-neutral-400">
              ({(order.services || []).length} items)
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddingService(prev => !prev)}
          >
            {isAddingService ? 'Cancel' : '+ Add Service Item'}
          </Button>
        </div>

        {/* Inline Add Service Form */}
        {isAddingService && (
          <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-200 shadow-2xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#FF8C00]" /> Add Service to {order.order_name}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPending}
                  onChange={e => setIsPending(e.target.checked)}
                  className="rounded text-[#FF8C00]"
                />
                <span>Pending Financial Confirmation</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. PCB Printing & Assembly"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white p-2 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                  Supplier Cost (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isPending}
                  placeholder={isPending ? 'Pending' : '0.00'}
                  value={isPending ? '' : supplierCost}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setSupplierCost(val);
                    if (typeof val === 'number') {
                      const m = markup === '' ? 0 : Number(markup);
                      setClientPrice(val + m);
                    }
                  }}
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white p-2 font-mono text-right focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none disabled:bg-neutral-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                  Profit / Margin (LKR)
                </label>
                <input
                  type="number"
                  disabled={isPending}
                  placeholder={isPending ? 'Pending' : '0.00'}
                  value={isPending ? '' : markup}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setMarkup(val);
                    if (typeof val === 'number') {
                      const c = supplierCost === '' ? 0 : Number(supplierCost);
                      setClientPrice(c + val);
                    }
                  }}
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white p-2 font-mono text-right focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none disabled:bg-neutral-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-1">
                  Customer Price (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isPending}
                  placeholder={isPending ? 'Pending' : '0.00'}
                  value={isPending ? '' : clientPrice}
                  onChange={e =>
                    setClientPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full text-xs rounded-lg border border-neutral-300 bg-white p-2 font-mono font-bold text-right text-neutral-900 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none disabled:bg-neutral-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsAddingService(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="button" onClick={handleSaveService}>
                Save Service Item
              </Button>
            </div>
          </div>
        )}

        {/* The Main Service Table on this Page */}
        <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/90 text-neutral-700 font-bold uppercase border-b border-neutral-200 text-[11px]">
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3.5">Service Name</th>
                <th className="py-3 px-3.5">Supplier Type</th>
                <th className="py-3 px-3.5 text-right font-semibold">Supplier Cost</th>
                <th className="py-3 px-3.5 text-right font-bold text-[#FF8C00]">Profit / Margin</th>
                <th className="py-3 px-3.5 text-right font-extrabold text-neutral-900">
                  Customer Price
                </th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {(order.services || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    No service items recorded for this order yet.
                  </td>
                </tr>
              ) : (
                (order.services || []).map((service, index) => (
                  <tr key={service.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center font-mono text-neutral-400 text-xs">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-neutral-900">
                      <div>{service.service_name}</div>
                      {service.notes && (
                        <div className="text-[10px] text-neutral-400 font-normal">
                          {service.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-neutral-600 capitalize">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-medium">
                        {service.supplier_type === 'in_house' ? 'In-house' : 'Outsourced'}
                      </span>
                    </td>

                    {/* Supplier Cost */}
                    <td className="py-3 px-3.5 text-right font-mono">
                      {service.is_financial_pending || service.supplier_cost === null ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px]">
                          Pending
                        </span>
                      ) : (
                        formatLKR(service.supplier_cost)
                      )}
                    </td>

                    {/* Profit */}
                    <td className="py-3 px-3.5 text-right font-mono text-[#FF8C00] font-bold">
                      {service.is_financial_pending || service.markup === null ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px]">
                          Not Confirmed
                        </span>
                      ) : (
                        formatLKR(service.markup)
                      )}
                    </td>

                    {/* Customer Price */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-neutral-900">
                      {service.is_financial_pending || service.client_price === null ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px]">
                          Pending
                        </span>
                      ) : (
                        formatLKR(service.client_price)
                      )}
                    </td>

                    {/* Service Status */}
                    <td className="py-3 px-3.5 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 capitalize">
                        {service.service_status || 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-center">
                      {(order.services || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setServiceToDelete({ id: service.id, name: service.service_name })
                          }
                          className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-neutral-100 transition-colors"
                          title="Delete service item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer Totals */}
            {(order.services || []).length > 0 && (
              <tfoot>
                <tr className="bg-neutral-100/90 font-bold border-t-2 border-neutral-300 text-neutral-900">
                  <td colSpan={3} className="py-3 px-3.5 text-right uppercase text-[11px]">
                    Order Confirmed Totals:
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono">
                    {formatLKR(totalSupplierCosts)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-[#FF8C00]">
                    {formatLKR(totalGrossProfit)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-extrabold">
                    {formatLKR(totalRevenue)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Edit Order Modal */}
      <OrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        orderToEdit={order}
        campaigns={campaigns}
        onSave={async (orderData, services) => {
          updateOrder(order.id, { ...orderData, services: services as any });
          toast.success('Order details updated');
          setIsEditModalOpen(false);
        }}
      />

      {/* Delete Service Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        onConfirm={() => {
          if (serviceToDelete) {
            deleteServiceFromOrder(order.id, serviceToDelete.id);
            toast.success(`Service "${serviceToDelete.name}" removed`);
            setServiceToDelete(null);
          }
        }}
        title="Delete Service Item"
        message={`Are you sure you want to remove "${serviceToDelete?.name}" from this order?`}
        confirmText="Remove"
        isDestructive
      />

      {/* Delete Order Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          deleteOrder(order.id);
          toast.success('Order deleted');
          navigate('/orders');
        }}
        title="Delete Order"
        message={`Are you sure you want to delete order "${order.order_name}"?`}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};