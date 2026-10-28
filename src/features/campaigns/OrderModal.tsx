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
      status: OrderStatus;
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
  const [status, setStatus] = useState<OrderStatus>('confirmed');
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
      setStatus(orderToEdit.status || 'confirmed');
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
      setStatus('confirmed');
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
          notes: '',
        },
        {
          id: `temp-${Date.now()}-2`,
          service_name: 'PCB Printing',
          supplier_type: 'outsourced',
          supplier_cost: 2000,
          markup: 1000,
          client_price: 3000,
          is_financial_pending: false,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!orderName.trim()) {
      newErrors.orderName = 'Order name is required';
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
        notes: s.notes.trim() || null,
      }));

      await onSave(
        {
          order_name: orderName.trim(),
          customer_name: customerName.trim() || null,
          customer_phone: customerPhone.trim() || null,
          order_date: orderDate,
          campaign_id: campaignId === 'no_campaign' ? null : campaignId,
          status,
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
      title={isEditing ? 'Edit Customer Order' : 'Record New Order / Inquiry'}
      description="Record customer orders received during campaigns or manual direct orders from friends and clients."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Name & Campaign Association */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Order Name / Project Title *"
            placeholder="e.g. Smart Dispensing Drug Timer Medicine"
            value={orderName}
            onChange={e => setOrderName(e.target.value)}
            error={errors.orderName}
            autoFocus
          />

          <Select
            label="Associated Ad Campaign"
            value={campaignId}
            onChange={e => setCampaignId(e.target.value)}
            options={[
              { value: 'no_campaign', label: 'No Campaign (Direct / Word-of-Mouth)' },
              ...campaigns.map(c => ({
                value: c.id,
                label: `${c.campaign_code} — ${c.name} (${c.status.toUpperCase()})`,
              })),
            ]}
          />
        </div>

        {/* Customer Info & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Customer Name (Optional)"
            placeholder="e.g. Dr. K. Perera"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
          />

          <Input
            label="Customer Phone (Optional)"
            placeholder="e.g. 0771234567"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
          />

          <Input
            type="date"
            label="Order Date *"
            value={orderDate}
            onChange={e => setOrderDate(e.target.value)}
            error={errors.orderDate}
          />
        </div>

        {/* Order Status */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-neutral-800">Order Status</label>
              <p className="text-[11px] text-neutral-500">
                Pending inquiries and cancelled orders do not inflate confirmed revenue.
              </p>
            </div>
            <div className="w-full sm:w-56">
              <Select
                value={status}
                onChange={e => setStatus(e.target.value as OrderStatus)}
                options={[
                  { value: 'pending', label: '⏳ Pending Confirmation (Inquiry)' },
                  { value: 'confirmed', label: '✓ Confirmed (Ready to Bill)' },
                  { value: 'in_progress', label: '⚡ In Progress' },
                  { value: 'completed', label: '🎉 Completed' },
                  { value: 'cancelled', label: '✕ Cancelled' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Services Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Service Items & Financial Pricing
              </h4>
              <p className="text-[11px] text-neutral-500">
                Client Price = Supplier Cost + My Profit / Markup
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddService}
            >
              Add Service
            </Button>
          </div>

          {errors.services && (
            <p className="text-xs text-red-600 font-medium">{errors.services}</p>
          )}

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {services.map((service, index) => (
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
                      <span>Cost Pending</span>
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
                      My Markup (LKR)
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      placeholder={service.is_financial_pending ? 'Not decided' : '0.00'}
                      disabled={service.is_financial_pending}
                      className="text-xs w-full rounded border border-neutral-200 p-1.5 font-mono disabled:bg-neutral-100 disabled:text-neutral-400"
                      value={service.is_financial_pending ? '' : service.markup}
                      onChange={e => handleServiceChange(index, 'markup', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                      Client Price (LKR)
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      placeholder={service.is_financial_pending ? 'Not decided' : '0.00'}
                      disabled={service.is_financial_pending}
                      className="text-xs w-full rounded border border-neutral-200 p-1.5 font-mono font-bold text-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400"
                      value={service.is_financial_pending ? '' : service.client_price}
                      onChange={e => handleServiceChange(index, 'client_price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Order Summary Box */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-900 text-white p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Order Financial Summary</span>
            {hasIncomplete ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Incomplete Pricing Excluded
              </span>
            ) : status === 'pending' ? (
              <span className="text-blue-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Pending Inquiry
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center border-t border-neutral-800 pt-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Total Revenue</p>
              <p className="text-sm sm:text-base font-bold font-mono text-white">
                {formatLKR(totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Supplier Costs</p>
              <p className="text-sm sm:text-base font-bold font-mono text-neutral-300">
                {formatLKR(totalSupplierCosts)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Gross Profit</p>
              <p className="text-sm sm:text-base font-bold font-mono text-[#FF8C00]">
                {formatLKR(grossProfit)}
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

