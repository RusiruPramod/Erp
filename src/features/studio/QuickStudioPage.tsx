import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudioProjectRow, InvoiceItem } from './types';
import {
  Plus,
  Save,
  FileText,
  Trash2,
  ChevronDown,
  ChevronRight,
  Printer,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatLKR } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

const STORAGE_KEY = 'codecrew_studio_rows_v2';

// Generate a unique ID
const uid = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Default blank item
const blankItem = (): InvoiceItem => ({
  id: uid(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
});

// Default blank project
const blankProject = (): StudioProjectRow => ({
  id: `row-${Date.now()}`,
  rowNumber: 1,
  date: new Date().toISOString().split('T')[0],
  projectName: '',
  clientName: '',
  clientCompany: '',
  clientAttn: '',
  clientAddress: '',
  clientPhone: '',
  clientEmail: '',
  invoiceNumber: 'INV-001',
  refQuotation: '',
  serviceTitle: '',
  serviceDescription: '',
  items: [blankItem()],
  subtotal: 0,
  discount: 0,
  tax: 0,
  brokerName: '',
  brokerFee: 0,
  outsourceWorkerName: '',
  outsourceWorkerFee: 0,
  myProfit: 0,
  total: 0,
  status: 'draft',
  notes: '',
});

// ─── Main Component ──────────────────────────────────────────
export const QuickStudioPage: React.FC = () => {
  // Load from localStorage or start fresh
  const [project, setProject] = useState<StudioProjectRow>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Support old array format — take first row
        const row = Array.isArray(parsed) ? parsed[0] : parsed;
        if (row && row.id) {
          // Ensure items array exists
          if (!row.items || !Array.isArray(row.items) || row.items.length === 0) {
            row.items = [blankItem()];
          }
          return row;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved invoice', e);
    }
    return blankProject();
  });

  const [showAdditional, setShowAdditional] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.error('Failed to save', e);
    }
  }, [project]);

  // ─── Field Updaters ──────────────────────────────────────
  const updateField = useCallback(
    (field: keyof StudioProjectRow, value: any) => {
      setProject(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  // ─── Items Logic ─────────────────────────────────────────
  const updateItem = useCallback(
    (itemId: string, field: keyof InvoiceItem, value: any) => {
      setProject(prev => {
        const items = (prev.items || []).map(item => {
          if (item.id !== itemId) return item;
          const updated = { ...item, [field]: value };
          // Auto-calculate amount
          if (field === 'quantity' || field === 'unitPrice') {
            const qty = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
            const price = field === 'unitPrice' ? Number(value) || 0 : Number(item.unitPrice) || 0;
            updated.amount = qty * price;
          }
          return updated;
        });
        // Recalculate totals
        const subtotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const discount = Number(prev.discount) || 0;
        const tax = Number(prev.tax) || 0;
        const total = subtotal - discount + tax;
        return { ...prev, items, subtotal, total };
      });
    },
    []
  );

  const addItem = useCallback(() => {
    setProject(prev => ({
      ...prev,
      items: [...(prev.items || []), blankItem()],
    }));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setProject(prev => {
      const items = (prev.items || []).filter(i => i.id !== itemId);
      if (items.length === 0) items.push(blankItem());
      const subtotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const discount = Number(prev.discount) || 0;
      const tax = Number(prev.tax) || 0;
      const total = subtotal - discount + tax;
      return { ...prev, items, subtotal, total };
    });
  }, []);

  // ─── Save / Sync ─────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      if (isSupabaseConfigured) {
        let customerId = '00000000-0000-0000-0000-000000000005';
        const { data: custData } = await supabase
          .from('customers')
          .select('id')
          .eq('name', project.clientCompany || project.clientName)
          .maybeSingle();
        if (custData) customerId = custData.id;
        await supabase.from('projects').upsert(
          {
            name: project.projectName,
            customer_id: customerId,
            project_date: project.date,
            price: project.total,
            outsourcer_name: project.outsourceWorkerName || null,
            outsourcer_cost: project.outsourceWorkerFee || 0,
            broker_name: project.brokerName || null,
            broker_commission: project.brokerFee || 0,
            status: 'active',
            notes: project.serviceDescription,
          },
          { onConflict: 'name' }
        );
        toast.success('Invoice synced to database!');
      } else {
        toast.success('Invoice saved locally!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewInvoice = () => {
    setProject(blankProject());
    toast.info('New blank invoice created');
  };

  // ─── Print ───────────────────────────────────────────────
  const handlePrint = () => window.print();

  const handleCopy = () => {
    const text = `INVOICE ${project.invoiceNumber} | ${project.projectName || 'Untitled'} | Total: Rs. ${(project.total || 0).toFixed(2)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Invoice summary copied');
    setTimeout(() => setCopied(false), 2000);
  };

  // Format date for preview
  const formattedDate = (() => {
    try {
      if (!project.date) return '';
      const d = new Date(project.date);
      if (isNaN(d.getTime())) return project.date;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return project.date;
    }
  })();

  const items = project.items || [blankItem()];
  const subtotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const discount = Number(project.discount) || 0;
  const tax = Number(project.tax) || 0;
  const grandTotal = subtotal - discount + tax;

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-full bg-[#EEF1F5] overflow-hidden">
      {/* ── Top Header Bar ───────────────────────────────── */}
      <header className="bg-white border-b border-neutral-200 px-5 py-3 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-md">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-900 leading-tight">Invoice Studio</h1>
            <p className="text-[11px] text-neutral-400 font-medium">Simple editor · Live preview</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save
          </Button>
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            title="Print / Export PDF"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Split Panel ─────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Form Editor ──────────────────────────── */}
        <div className="w-[420px] min-w-[360px] max-w-[480px] bg-white border-r border-neutral-200 overflow-y-auto shrink-0">
          <div className="p-5 space-y-6">
            {/* ── Invoice Details Section ──────────────── */}
            <section>
              <h2 className="text-sm font-bold text-neutral-900 mb-4">Invoice Details</h2>
              <div className="space-y-3.5">
                {/* Invoice No. */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Invoice No.</label>
                  <input
                    type="text"
                    value={project.invoiceNumber}
                    onChange={e => updateField('invoiceNumber', e.target.value)}
                    placeholder="INV-001"
                    className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={project.date}
                    onChange={e => updateField('date', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>

                {/* Customer */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Customer</label>
                  <input
                    type="text"
                    value={project.clientCompany || project.clientName}
                    onChange={e => {
                      updateField('clientCompany', e.target.value);
                      updateField('clientName', e.target.value);
                    }}
                    placeholder="Customer name or company"
                    className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* ── Items Section ────────────────────────── */}
            <section>
              <h2 className="text-sm font-bold text-neutral-900 mb-3">Items</h2>

              {/* Items Table */}
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_60px_80px_32px] gap-0 bg-neutral-50 border-b border-neutral-200 px-3 py-2">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Description</span>
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide text-center">Qty</span>
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide text-right">Price</span>
                  <span></span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-neutral-100">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_60px_80px_32px] gap-0 items-center px-3 py-1.5 group hover:bg-blue-50/30 transition-colors"
                    >
                      {/* Description */}
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder={idx === 0 ? 'Service or product name...' : ''}
                        className="w-full text-sm text-neutral-800 bg-transparent border-0 p-1 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded placeholder:text-neutral-300"
                      />
                      {/* Qty */}
                      <input
                        type="number"
                        min="0"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', Number(e.target.value) || 0)}
                        className="w-full text-sm text-neutral-800 bg-transparent border-0 p-1 text-center focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded font-mono"
                      />
                      {/* Unit Price */}
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                        onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full text-sm text-neutral-800 bg-transparent border-0 p-1 text-right focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded font-mono placeholder:text-neutral-300"
                      />
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex items-center justify-center w-6 h-6 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Item */}
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
              >
                <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                Add item
              </button>
            </section>

            {/* ── Additional Details (Collapsible) ─────── */}
            <section>
              <button
                type="button"
                onClick={() => setShowAdditional(!showAdditional)}
                className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-colors w-full"
              >
                {showAdditional ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                Additional details
              </button>

              {showAdditional && (
                <div className="mt-3 space-y-3.5 pl-6 animate-in slide-in-from-top-2 duration-200">
                  {/* Due Date */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={project.dueDate || ''}
                      onChange={e => updateField('dueDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    />
                  </div>

                  {/* Client Attn */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Attention (Attn)</label>
                    <input
                      type="text"
                      value={project.clientAttn || ''}
                      onChange={e => updateField('clientAttn', e.target.value)}
                      placeholder="e.g. Managing Director"
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    />
                  </div>

                  {/* Client Address */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Billing Address</label>
                    <textarea
                      rows={2}
                      value={project.clientAddress || ''}
                      onChange={e => updateField('clientAddress', e.target.value)}
                      placeholder="Client address..."
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Phone</label>
                      <input
                        type="text"
                        value={project.clientPhone || ''}
                        onChange={e => updateField('clientPhone', e.target.value)}
                        placeholder="+94 77..."
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={project.clientEmail || ''}
                        onChange={e => updateField('clientEmail', e.target.value)}
                        placeholder="email@..."
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Ref Quotation */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Ref. Quotation</label>
                    <input
                      type="text"
                      value={project.refQuotation || ''}
                      onChange={e => updateField('refQuotation', e.target.value)}
                      placeholder="CC-QUO-2026-001"
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    />
                  </div>

                  {/* Discount & Tax */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Discount (Rs.)</label>
                      <input
                        type="number"
                        min="0"
                        value={project.discount || ''}
                        onChange={e => {
                          const disc = Number(e.target.value) || 0;
                          setProject(prev => ({
                            ...prev,
                            discount: disc,
                            total: (prev.subtotal || 0) - disc + (Number(prev.tax) || 0),
                          }));
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Tax (Rs.)</label>
                      <input
                        type="number"
                        min="0"
                        value={project.tax || ''}
                        onChange={e => {
                          const t = Number(e.target.value) || 0;
                          setProject(prev => ({
                            ...prev,
                            tax: t,
                            total: (prev.subtotal || 0) - (Number(prev.discount) || 0) + t,
                          }));
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Notes</label>
                    <textarea
                      rows={2}
                      value={project.notes || ''}
                      onChange={e => updateField('notes', e.target.value)}
                      placeholder="Additional notes for this invoice..."
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── RIGHT: Live A4 Preview ─────────────────────── */}
        <div className="flex-1 bg-[#E8ECF0] overflow-y-auto flex flex-col">
          {/* Preview Header */}
          <div className="no-print flex items-center justify-between px-5 py-2.5 bg-[#E8ECF0] border-b border-neutral-300/50 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                Live Preview · A4
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-white/60 transition-all"
                title="Copy summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-white/60 transition-all"
                title="Print / PDF"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* A4 Paper */}
          <div className="flex-1 flex justify-center py-6 px-4">
            <div
              id="printable-invoice"
              className="print-container w-full max-w-[794px] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.08)] rounded-sm flex flex-col"
              style={{
                minHeight: '1050px',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                padding: '52px 56px',
              }}
            >
              {/* ── Invoice Header ───────────────────────── */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-2xl font-black tracking-tight text-blue-700 leading-none">
                    INVOICE
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Invoice Number */}
              <div className="text-xs text-neutral-500 mb-5 font-medium">
                Invoice # <span className="text-neutral-800 font-semibold">{project.invoiceNumber || 'INV-001'}</span>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-neutral-200 mb-6"></div>

              {/* Bill To */}
              <div className="mb-8">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-2">
                  Bill To
                </div>
                {(project.clientCompany || project.clientName) ? (
                  <div>
                    <div className="text-sm font-bold text-neutral-900">
                      {project.clientCompany || project.clientName}
                    </div>
                    {project.clientAttn && (
                      <div className="text-xs text-neutral-600 mt-0.5">Attn: {project.clientAttn}</div>
                    )}
                    {project.clientAddress && (
                      <div className="text-xs text-neutral-500 mt-0.5 whitespace-pre-line">{project.clientAddress}</div>
                    )}
                    {project.clientPhone && (
                      <div className="text-xs text-neutral-500 mt-0.5">{project.clientPhone}</div>
                    )}
                    {project.clientEmail && (
                      <div className="text-xs text-neutral-500">{project.clientEmail}</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="h-3 bg-neutral-100 rounded w-48 animate-pulse"></div>
                    <div className="h-2.5 bg-neutral-100 rounded w-36 animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Date Row */}
              {project.date && (
                <div className="flex items-center gap-4 text-xs text-neutral-500 mb-6">
                  <span><span className="font-semibold text-neutral-700">Date:</span> {formattedDate}</span>
                  {project.refQuotation && (
                    <span><span className="font-semibold text-neutral-700">Ref:</span> {project.refQuotation}</span>
                  )}
                </div>
              )}

              {/* ── Items Table ──────────────────────────── */}
              <div className="mb-6 flex-1">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_50px_90px_100px] gap-0 border-t-2 border-b border-neutral-800 py-2.5">
                  <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wide">Description</span>
                  <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wide text-center">Qty</span>
                  <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wide text-right">Price</span>
                  <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wide text-right">Amount</span>
                </div>

                {/* Table Rows */}
                {items.some(i => i.description || i.amount > 0) ? (
                  items
                    .filter(i => i.description || i.amount > 0)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1fr_50px_90px_100px] gap-0 border-b border-neutral-100 py-2.5"
                      >
                        <span className="text-xs text-neutral-800 font-medium pr-3">{item.description}</span>
                        <span className="text-xs text-neutral-600 text-center font-mono">{item.quantity}</span>
                        <span className="text-xs text-neutral-600 text-right font-mono">
                          {Number(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-neutral-900 text-right font-mono font-semibold">
                          {Number(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))
                ) : (
                  /* Placeholder rows when empty */
                  <div className="py-4 space-y-3">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="grid grid-cols-[1fr_50px_90px_100px] gap-0">
                        <div className="h-2.5 bg-neutral-100 rounded w-3/4 animate-pulse"></div>
                        <div></div>
                        <div></div>
                        <div className="h-2.5 bg-neutral-100 rounded w-2/3 ml-auto animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Totals ───────────────────────────────── */}
              <div className="mt-auto">
                <div className="border-t border-neutral-200 pt-3 space-y-1.5">
                  {/* Subtotal */}
                  {(discount > 0 || tax > 0) && (
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Subtotal</span>
                      <span className="font-mono text-neutral-700">
                        Rs. {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {/* Discount */}
                  {discount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Discount</span>
                      <span className="font-mono text-red-600">
                        - Rs. {discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {/* Tax */}
                  {tax > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Tax</span>
                      <span className="font-mono text-neutral-700">
                        Rs. {tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-baseline border-t-2 border-neutral-800 pt-3 mt-2">
                  <span className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Total</span>
                  <span className="text-lg font-black text-neutral-900 font-mono">
                    Rs. {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Print Styles ─────────────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 20mm !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
