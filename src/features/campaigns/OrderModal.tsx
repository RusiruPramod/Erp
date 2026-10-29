import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import {
  AdCampaignOrder,
  AdOrderService,
  OrderStatus,
  CustomerPaymentStatus,
  SupplierPaymentStatus,
  LeadSource,
  SupplierType,
  AdCampaign,
} from '../../types';
import { formatLKR, formatDateInput } from '../../lib/formatters';
import { Plus, Trash2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: AdCampaignOrder | null;
  defaultCampaignId?: string | null;
  campaigns: AdCampaign[];
  onSave: (
    orderData: {
      order_name: string;
      customer_name?: string | null;
      customer_phone?: string | null;
      order_date: string;
      campaign_id: string | null;
      lead_source?: LeadSource;
      status: OrderStatus;
      payment_status?: CustomerPaymentStatus;
      customer_paid_amount?: number;
      supplier_payment_status?: SupplierPaymentStatus;
      supplier_paid_amount?: number;
      manual_allocated_ad_spend?: number | null;
      notes?: string | null;
    },
    services: Array<Omit<AdOrderService, 'id' | 'order_id'>>
  ) => Promise<void>;
}

interface EditableService {
  id: string;
  service_name: string;
  supplier_type: SupplierType;
  supplier_cost: number | '';
  markup: number | '';
  client_price: number | '';
  is_financial_pending: boolean;
  supplier_payment_status?: SupplierPaymentStatus;
  customer_payment_status?: CustomerPaymentStatus;
  service_status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  orderToEdit,
  defaultCampaignId,
  campaigns,
  onSave,
}) => {
  const isEditing = Boolean(orderToEdit);

  const [orderName, setOrderName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderDate, setOrderDate] = useState(formatDateInput(new Date()));
  const [campaignId, setCampaignId] = useState<string>('no_campaign');
  const [leadSource, setLeadSource] = useState<LeadSource>('Facebook Campaign');
  const [status, setStatus] = useState<OrderStatus>('confirmed');

  // Payment Tracking Fields
  const [paymentStatus, setPaymentStatus] = useState<CustomerPaymentStatus>('unpaid');
  const [customerPaidAmount, setCustomerPaidAmount] = useState<number | ''>(0);
  const [supplierPaymentStatus, setSupplierPaymentStatus] = useState<SupplierPaymentStatus>('unpaid');
  const [supplierPaidAmount, setSupplierPaidAmount] = useState<number | ''>(0);
  const [manualAllocatedAdSpend, setManualAllocatedAdSpend] = useState<number | ''>('');

  const [notes, setNotes] = useState('');
  const [services, setServices] = useState<EditableService[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (orderToEdit) {
      setOrderName(orderToEdit.order_name || '');
      setCustomerName(orderToEdit.customer_name || '');
      setCustomerPhone(orderToEdit.customer_phone || '');
      setOrderDate(formatDateInput(orderToEdit.order_date));
      setCampaignId(orderToEdit.campaign_id || 'no_campaign');
      setLeadSource(orderToEdit.lead_source || 'Facebook Campaign');
      setStatus(orderToEdit.status || 'confirmed');
      setPaymentStatus(orderToEdit.payment_status || 'unpaid');
      setCustomerPaidAmount(orderToEdit.customer_paid_amount ?? 0);
      setSupplierPaymentStatus(orderToEdit.supplier_payment_status || 'unpaid');
      setSupplierPaidAmount(orderToEdit.supplier_paid_amount ?? 0);
      setManualAllocatedAdSpend(orderToEdit.manual_allocated_ad_spend ?? '');
      setNotes(orderToEdit.notes || '');

      if (orderToEdit.services && orderToEdit.services.length > 0) {
        setServices(
          orderToEdit.services.map(s => ({
            id: s.id,
            service_name: s.service_name,
            supplier_type: s.supplier_type,
            supplier_cost: s.supplier_cost ?? '',
            markup: s.markup ?? '',
            client_price: s.client_price ?? '',
            is_financial_pending: Boolean(s.is_financial_pending),
            supplier_payment_status: s.supplier_payment_status || 'unpaid',
            customer_payment_status: s.customer_payment_status || 'unpaid',
            service_status: s.service_status || 'pending',
            notes: s.notes || '',
          }))
        );
      } else {
        setServices([
          {
            id: `temp-${Date.now()}-1`,
            service_name: 'PCB Design',
            supplier_type: 'outsourced',
            supplier_cost: '',
            markup: '',
            client_price: '',
            is_financial_pending: false,
            supplier_payment_status: 'unpaid',
            customer_payment_status: 'unpaid',
            service_status: 'pending',
            notes: '',
          },
        ]);
      }
    } else {
      setOrderName('');
      setCustomerName('');
      setCustomerPhone('');
      setOrderDate(formatDateInput(new Date()));
      setCampaignId(defaultCampaignId || 'no_campaign');
      setLeadSource(defaultCampaignId && defaultCampaignId !== 'no_campaign' ? 'Facebook Campaign' : 'Direct Message');
      setStatus('confirmed');
      setPaymentStatus('unpaid');
      setCustomerPaidAmount(0);
      setSupplierPaymentStatus('unpaid');
      setSupplierPaidAmount(0);
      setManualAllocatedAdSpend('');
      setNotes('');
      setServices([
        {
          id: `temp-${Date.now()}-1`,
          service_name: 'PCB Design',
          supplier_type: 'outsourced',
          supplier_cost: 4000,
          markup: 4000,
          client_price: 8000,
          is_financial_pending: false,
          supplier_payment_status: 'unpaid',
          customer_payment_status: 'unpaid',
          service_status: 'pending',
          notes: '',
        },
      ]);
    }
    setErrors({});
  }, [orderToEdit, defaultCampaignId, isOpen]);

  const handleAddService = () => {
    setServices([
      ...services,
      {
        id: `temp-${Date.now()}-${services.length}`,
        service_name: '',
        supplier_type: 'outsourced',
        supplier_cost: '',
        markup: '',
        client_price: '',
        is_financial_pending: false,
        supplier_payment_status: 'unpaid',
        customer_payment_status: 'unpaid',
        service_status: 'pending',
        notes: '',
      },
    ]);
  };

  const handleRemoveService = (index: number) => {
    if (services.length <= 1) return;
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: keyof EditableService, value: any) => {
    const updated = [...services];
    const item = { ...updated[index], [field]: value };

    // Auto-calculate client price when cost or markup changes
    if (field === 'supplier_cost' || field === 'markup') {
      const cost = field === 'supplier_cost' ? (value === '' ? 0 : Number(value)) : (item.supplier_cost === '' ? 0 : Number(item.supplier_cost));
      const markup = field === 'markup' ? (value === '' ? 0 : Number(value)) : (item.markup === '' ? 0 : Number(item.markup));
      item.client_price = cost + markup;
    } else if (field === 'client_price') {
      const price = value === '' ? 0 : Number(value);
      const cost = item.supplier_cost === '' ? 0 : Number(item.supplier_cost);
      item.markup = Math.max(0, price - cost);
    }

    updated[index] = item;
    setServices(updated);
  };

  // Live order calculations
  let totalRevenue = 0;
  let totalSupplierCosts = 0;
  let hasIncomplete = false;

  services.forEach(s => {
    if (s.is_financial_pending || s.supplier_cost === '' || s.client_price === '') {
      hasIncomplete = true;
    } else {
      totalRevenue += Number(s.client_price) || 0;
      totalSupplierCosts += Number(s.supplier_cost) || 0;
    }
  });

  const grossProfit = totalRevenue - totalSupplierCosts;
  const custPaid = Number(customerPaidAmount) || (paymentStatus === 'fully_paid' ? totalRevenue : 0);
  const suppPaid = Number(supplierPaidAmount) || (supplierPaymentStatus === 'fully_paid' ? totalSupplierCosts : 0);

  const customerRemainingBalance = Math.max(0, totalRevenue - custPaid);
  const supplierRemainingBalance = Math.max(0, totalSupplierCosts - suppPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!orderName.trim()) {
      newErrors.orderName = 'Order / Project name is required';
    }
    if (!orderDate) {
      newErrors.orderDate = 'Order date is required';
    }
    if (services.length === 0) {
      newErrors.services = 'At least one service is required';
    }

    const hasEmptyServiceNames = services.some(s => !s.service_name.trim());
    if (hasEmptyServiceNames) {
      newErrors.services = 'All services must have a valid service name';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedServices: Array<Omit<AdOrderService, 'id' | 'order_id'>> = services.map((s, idx) => ({
        position: idx + 1,
        service_name: s.service_name.trim(),
        supplier_type: s.supplier_type,
        supplier_cost: s.is_financial_pending || s.supplier_cost === '' ? null : Number(s.supplier_cost),
        markup: s.is_financial_pending || s.markup === '' ? null : Number(s.markup),
        client_price: s.is_financial_pending || s.client_price === '' ? null : Number(s.client_price),
        is_financial_pending: s.is_financial_pending || s.supplier_cost === '' || s.client_price === '',
        supplier_payment_status: s.supplier_payment_status || 'unpaid',
        customer_payment_status: s.customer_payment_status || 'unpaid',
        service_status: s.service_status || 'pending',
        notes: s.notes.trim() || null,
      }));

      await onSave(
        {
          order_name: orderName.trim(),
          customer_name: customerName.trim() || null,
          customer_phone: customerPhone.trim() || null,
          order_date: orderDate,
          campaign_id: campaignId === 'no_campaign' ? null : campaignId,
          lead_source: leadSource,
          status,
          payment_status: paymentStatus,
          customer_paid_amount: custPaid,
          supplier_payment_status: supplierPaymentStatus,
          supplier_paid_amount: suppPaid,
          manual_allocated_ad_spend: manualAllocatedAdSpend === '' ? null : Number(manualAllocatedAdSpend),
          notes: notes.trim() || null,
        },
        formattedServices
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
      title={isEditing ? 'Edit Customer Order' : 'Record New Customer Order'}
      description="Record customer orders with multi-service cost breakdown, profit margin, and payment tracking."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name & Campaign Association */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Project Name / Order Title *"
            placeholder="e.g. Smart Dispensing Drug Timer Medicine"
            value={orderName}
            onChange={e => setOrderName(e.target.value)}
            error={errors.orderName}
            autoFocus
          />

          <Select
            label="Associated Ad Campaign (Optional)"
            value={campaignId}
            onChange={e => {
              setCampaignId(e.target.value);
              if (e.target.value !== 'no_campaign') {
                setLeadSource('Facebook Campaign');
              }
            }}
            options={[
              { value: 'no_campaign', label: 'No Campaign (Direct / Word-of-Mouth)' },
              ...campaigns.map(c => ({
                value: c.id,
                label: `${c.campaign_code} — ${c.name} (${c.status.toUpperCase()})`,
              })),
            ]}
          />
        </div>

        {/* Customer Info, Contact & Lead Source */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Customer Name"
            placeholder="e.g. Dr. K. Perera"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
          />

          <Input
            label="Customer Phone / Contact"
            placeholder="e.g. 0771234567"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
          />

          <Select
            label="Lead Source"
            value={leadSource}
            onChange={e => setLeadSource(e.target.value as LeadSource)}
            options={[
              { value: 'Facebook Campaign', label: 'Facebook Campaign' },
              { value: 'Direct Message', label: 'Direct Message / WhatsApp' },
              { value: 'Friend / Referral', label: 'Friend / Referral' },
              { value: 'Existing Customer', label: 'Existing Customer' },
              { value: 'Manual Entry', label: 'Manual Entry' },
              { value: 'Other', label: 'Other Source' },
            ]}
          />
        </div>

        {/* Date & Order Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="date"
            label="Order Received Date *"
            value={orderDate}
            onChange={e => setOrderDate(e.target.value)}
            error={errors.orderDate}
            helperText="Custom or historical date supported"
          />

          <Select
            label="Order Status"
            value={status}
            onChange={e => setStatus(e.target.value as OrderStatus)}
            options={[
              { value: 'new', label: 'New Inquiry' },
              { value: 'quotation_pending', label: 'Quotation Pending (Awaiting Costs)' },
              { value: 'confirmed', label: 'Confirmed (Quote Accepted)' },
              { value: 'in_progress', label: 'In Progress (Active Work)' },
              { value: 'waiting_for_supplier', label: 'Waiting for Supplier / PCB Print' },
              { value: 'quality_check', label: 'Quality Check' },
              { value: 'ready_for_delivery', label: 'Ready for Delivery' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>

        {/* Payment Tracking Section */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Payment & Balance Tracking
            </span>
            <span className="text-[11px] text-neutral-500">
              Track customer receipts and supplier payments separately
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Payment */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-2">
              <span className="text-[11px] font-bold text-neutral-700 uppercase block">
                Customer Payment Status
              </span>
              <Select
                value={paymentStatus}
                onChange={e => {
                  const val = e.target.value as CustomerPaymentStatus;
                  setPaymentStatus(val);
                  if (val === 'fully_paid') {
                    setCustomerPaidAmount(totalRevenue);
                  } else if (val === 'unpaid' || val === 'not_invoiced') {
                    setCustomerPaidAmount(0);
                  }
                }}
                options={[
                  { value: 'not_invoiced', label: 'Not Invoiced' },
                  { value: 'unpaid', label: 'Unpaid (0 Received)' },
                  { value: 'partially_paid', label: 'Partially Paid (Advance/Deposit)' },
                  { value: 'fully_paid', label: 'Fully Paid (Completed)' },
                  { value: 'refunded', label: 'Refunded' },
                ]}
              />

              <Input
                type="number"
                step="100"
                min="0"
                label="Customer Amount Received (LKR)"
                value={customerPaidAmount}
                onChange={e => setCustomerPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                helperText={`Remaining Balance: ${formatLKR(customerRemainingBalance)}`}
              />
            </div>

            {/* Supplier Payment */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-2">
              <span className="text-[11px] font-bold text-neutral-700 uppercase block">
                Supplier Cost Payment Status
              </span>
              <Select
                value={supplierPaymentStatus}
                onChange={e => {
                  const val = e.target.value as SupplierPaymentStatus;
                  setSupplierPaymentStatus(val);
                  if (val === 'fully_paid') {
                    setSupplierPaidAmount(totalSupplierCosts);
                  } else if (val === 'unpaid' || val === 'pending_cost_confirmation') {
                    setSupplierPaidAmount(0);
                  }
                }}
                options={[
                  { value: 'pending_cost_confirmation', label: 'Pending Cost Confirmation' },
                  { value: 'unpaid', label: 'Unpaid to Supplier' },
                  { value: 'partially_paid', label: 'Partially Paid (Deposit Paid)' },
                  { value: 'fully_paid', label: 'Fully Paid to Supplier' },
                ]}
              />

              <Input
                type="number"
                step="100"
                min="0"
                label="Supplier Amount Paid (LKR)"
                value={supplierPaidAmount}
                onChange={e => setSupplierPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                helperText={`Remaining Payable: ${formatLKR(supplierRemainingBalance)}`}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Services Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Service Line Items & Cost Breakdown
              </h4>
              <p className="text-[11px] text-neutral-500">
                Customer Price = Supplier Cost + My Profit / Margin
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddService}
            >
              + Add Service
            </Button>
          </div>

          {errors.services && (
            <p className="text-xs text-red-600 font-medium">{errors.services}</p>
          )}

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {services.map((service, index) => {
              const expectedClientPrice =
                (Number(service.supplier_cost) || 0) + (Number(service.markup) || 0);
              const hasMismatch =
                !service.is_financial_pending &&
                service.client_price !== '' &&
                service.supplier_cost !== '' &&
                Math.abs(Number(service.client_price) - expectedClientPrice) > 0.01;

              return (
                <div
                  key={service.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    service.is_financial_pending
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-400">#{index + 1}</span>
                      <input
                        type="text"
                        className="text-xs font-semibold text-neutral-900 border-b border-neutral-300 focus:border-[#FF8C00] outline-none px-1 py-0.5 w-44 sm:w-56"
                        placeholder="Service name (e.g. PCB Design)"
                        value={service.service_name}
                        onChange={e => handleServiceChange(index, 'service_name', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Financial Pending Toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-600 select-none">
                        <input
                          type="checkbox"
                          checked={service.is_financial_pending}
                          onChange={e => handleServiceChange(index, 'is_financial_pending', e.target.checked)}
                          className="rounded border-neutral-300 text-[#FF8C00] focus:ring-[#FF8C00]"
                        />
                        <span className="font-semibold text-amber-700">Cost Pending</span>
                      </label>

                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveService(index)}
                          className="text-neutral-400 hover:text-red-600 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                        Supplier Type
                      </label>
                      <select
                        className="text-xs w-full rounded border border-neutral-200 p-1.5 bg-white text-neutral-800"
                        value={service.supplier_type}
                        onChange={e => handleServiceChange(index, 'supplier_type', e.target.value as SupplierType)}
                      >
                        <option value="outsourced">Outsourced</option>
                        <option value="in_house">In-house (Direct)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                        Supplier Cost (LKR)
                      </label>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        placeholder={service.is_financial_pending ? 'Pending' : '0.00'}
                        disabled={service.is_financial_pending}
                        className="text-xs w-full rounded border border-neutral-200 p-1.5 font-mono disabled:bg-neutral-100 disabled:text-neutral-400"
                        value={service.is_financial_pending ? '' : service.supplier_cost}
                        onChange={e => handleServiceChange(index, 'supplier_cost', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                        My Margin (LKR)
                      </label>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        placeholder={service.is_financial_pending ? 'Pending' : '0.00'}
                        disabled={service.is_financial_pending}
                        className="text-xs w-full rounded border border-neutral-200 p-1.5 font-mono disabled:bg-neutral-100 disabled:text-neutral-400"
                        value={service.is_financial_pending ? '' : service.markup}
                        onChange={e => handleServiceChange(index, 'markup', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                        Customer Price (LKR)
                      </label>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        placeholder={service.is_financial_pending ? 'Pending' : '0.00'}
                        disabled={service.is_financial_pending}
                        className="text-xs w-full rounded border border-neutral-200 p-1.5 font-mono font-bold text-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400"
                        value={service.is_financial_pending ? '' : service.client_price}
                        onChange={e => handleServiceChange(index, 'client_price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  {hasMismatch && (
                    <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded flex items-center gap-1 border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>
                        Manual override detected: Customer Price ({formatLKR(Number(service.client_price))}) differs from Cost + Margin ({formatLKR(expectedClientPrice)}).
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Order Summary Box */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 text-white p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Order Financial Summary</span>
            {hasIncomplete ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Pending Quotations Excluded from Totals
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fully Confirmed Pricing
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t border-neutral-800 pt-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Total Customer Price</p>
              <p className="text-base font-bold font-mono text-white">
                {formatLKR(totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Total Supplier Cost</p>
              <p className="text-base font-bold font-mono text-neutral-300">
                {formatLKR(totalSupplierCosts)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Expected Gross Profit</p>
              <p className="text-base font-bold font-mono text-[#FF8C00]">
                {formatLKR(grossProfit)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Customer Balance</p>
              <p className="text-base font-bold font-mono text-rose-400">
                {formatLKR(customerRemainingBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <Textarea
          label="Order Notes / Delivery Details"
          placeholder="Client specifications, delivery schedule, supplier contacts..."
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Order' : 'Record Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
