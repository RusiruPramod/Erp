import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudioProjectRow, InvoiceItem } from './types';
import {
  Plus,
  Save,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Building,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { formatLKR } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

const STORAGE_KEY = 'codecrew_studio_rows_v2';

const uid = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const blankItem = (): InvoiceItem => ({
  id: uid(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
});

const defaultProject = (): StudioProjectRow => ({
  id: `row-${Date.now()}`,
  rowNumber: 1,
  date: '2026-10-15',
  projectName: 'Google Workspace File Sync',
  clientName: 'Shamshard Marikkar (Managing Director)',
  clientCompany: 'InterMax (Pvt) Ltd.',
  clientAttn: 'Shamshard Marikkar (Managing Director)',
  clientAddress: '435/2, Dutugemunu Rd, Koswatte\nBattaramulla, Sri Lanka.',
  clientPhone: '+94 77 207 8626',
  clientEmail: 'intermaxsrilanka@gmail.com',
  invoiceNumber: 'CC-INV-2026-001',
  refQuotation: 'CC-GWS-SYNC-2026-001',
  serviceTitle: 'Google Workspace File Sync Implementation',
  serviceDescription:
    'Configuring common drive for enabling shared folder access among 3 laptops. Includes technical review, user requirement gathering, architecture planning, system configuration, and handover walkthrough. One-time fixed fee as per agreed quotation.',
  items: [
    {
      id: 'item-1',
      description: 'Google Workspace File Sync Implementation',
      quantity: 1,
      unitPrice: 30000,
      amount: 30000,
    },
  ],
  subtotal: 30000,
  discount: 0,
  tax: 0,
  brokerName: '',
  brokerFee: 0,
  outsourceWorkerName: '',
  outsourceWorkerFee: 0,
  myProfit: 30000,
  total: 30000,
  status: 'draft',
  notes: '',
});

export const QuickStudioPage: React.FC = () => {
  const [project, setProject] = useState<StudioProjectRow>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const row = Array.isArray(parsed) ? parsed[0] : parsed;
        if (row && (row.projectName || row.clientCompany || row.invoiceNumber)) {
          return row;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved invoice', e);
    }
    return defaultProject();
  });

  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showInternalDistribution, setShowInternalDistribution] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [project]);

  const updateField = useCallback((field: keyof StudioProjectRow, value: any) => {
    setProject(prev => {
      const updated = { ...prev, [field]: value };

      // Auto update profit calculation if cost fields changed
      if (field === 'brokerFee' || field === 'outsourceWorkerFee' || field === 'total') {
        const tot = field === 'total' ? Number(value) || 0 : Number(prev.total) || 0;
        const b = field === 'brokerFee' ? Number(value) || 0 : Number(prev.brokerFee) || 0;
        const o = field === 'outsourceWorkerFee' ? Number(value) || 0 : Number(prev.outsourceWorkerFee) || 0;
        updated.myProfit = Math.max(0, tot - b - o);
      } else if (field === 'myProfit') {
        const p = Number(value) || 0;
        const b = Number(prev.brokerFee) || 0;
        const o = Number(prev.outsourceWorkerFee) || 0;
        updated.total = b + o + p;
      }

      return updated;
    });
  }, []);

  const updateItem = useCallback((itemId: string, field: keyof InvoiceItem, value: any) => {
    setProject(prev => {
      const items = (prev.items || []).map(item => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
          const price = field === 'unitPrice' ? Number(value) || 0 : Number(item.unitPrice) || 0;
          updated.amount = qty * price;
        }
        return updated;
      });

      const subtotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const discount = Number(prev.discount) || 0;
      const total = Math.max(0, subtotal - discount);
      const broker = Number(prev.brokerFee) || 0;
      const outsource = Number(prev.outsourceWorkerFee) || 0;
      const myProfit = Math.max(0, total - broker - outsource);

      return {
        ...prev,
        items,
        subtotal,
        total,
        myProfit,
      };
    });
  }, []);

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
      const total = Math.max(0, subtotal - discount);
      const broker = Number(prev.brokerFee) || 0;
      const outsource = Number(prev.outsourceWorkerFee) || 0;
      const myProfit = Math.max(0, total - broker - outsource);

      return {
        ...prev,
        items,
        subtotal,
        total,
        myProfit,
      };
    });
  }, []);

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
            name: project.projectName || 'Google Workspace File Sync',
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
        toast.success('Invoice saved and synced to database!');
      } else {
        toast.success('Invoice saved locally!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setProject(defaultProject());
    toast.info('Invoice reset to default');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `INVOICE ${project.invoiceNumber} | ${project.projectName} | Amount: ${formatLKR(project.total)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Invoice summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = (() => {
    try {
      if (!project.date) return '15 October 2026';
      const d = new Date(project.date);
      if (isNaN(d.getTime())) return project.date;
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return project.date;
    }
  })();

  const items = project.items || [];
  const subtotal = Number(project.subtotal) || Number(project.total) || 0;
  const discount = Number(project.discount) || 0;
  const grandTotal = Math.max(0, subtotal - discount);

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      {/* ── Top Header Toolbar ───────────────────────────────── */}
      <header className="no-print h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between shrink-0 z-20">
        <div>
          <h1 className="text-sm font-bold text-neutral-900 leading-tight">Create Invoice</h1>
          <p className="text-[11px] text-neutral-400">Live preview & editor</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FF8C00] hover:bg-[#e07b00] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Invoice'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Split View ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-neutral-50">
        {/* ── LEFT: Form Input Workspace ─────────────────────── */}
        <div className="no-print w-full lg:w-[460px] lg:min-w-[420px] bg-white border-r border-neutral-200 overflow-y-auto shrink-0 p-5 space-y-6">
          {/* Section 1: Invoice & Project Details */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wider pb-1 border-b border-neutral-100">
              <FileText className="w-3.5 h-3.5 text-[#FF8C00]" />
              <span>Invoice & Project Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={project.invoiceNumber}
                  onChange={e => updateField('invoiceNumber', e.target.value)}
                  placeholder="CC-INV-2026-001"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Date</label>
                <input
                  type="date"
                  value={project.date}
                  onChange={e => updateField('date', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Project / Product Name</label>
                <input
                  type="text"
                  value={project.projectName}
                  onChange={e => updateField('projectName', e.target.value)}
                  placeholder="Google Workspace File Sync"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Ref Quotation (Optional)</label>
                <input
                  type="text"
                  value={project.refQuotation || ''}
                  onChange={e => updateField('refQuotation', e.target.value)}
                  placeholder="CC-GWS-SYNC-2026-001"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Billed To / Client Information */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wider pb-1 border-b border-neutral-100">
              <Building className="w-3.5 h-3.5 text-[#FF8C00]" />
              <span>Billed To / Client Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Company Name</label>
                <input
                  type="text"
                  value={project.clientCompany || ''}
                  onChange={e => updateField('clientCompany', e.target.value)}
                  placeholder="InterMax (Pvt) Ltd."
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Attention (Attn)</label>
                <input
                  type="text"
                  value={project.clientAttn || ''}
                  onChange={e => {
                    updateField('clientAttn', e.target.value);
                    if (!project.clientName) updateField('clientName', e.target.value);
                  }}
                  placeholder="Shamshard Marikkar (Managing Director)"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Billing Address</label>
              <textarea
                rows={2}
                value={project.clientAddress || ''}
                onChange={e => updateField('clientAddress', e.target.value)}
                placeholder="435/2, Dutugemunu Rd, Koswatte&#10;Battaramulla, Sri Lanka."
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={project.clientPhone || ''}
                  onChange={e => updateField('clientPhone', e.target.value)}
                  placeholder="+94 77 207 8626"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
                <input
                  type="email"
                  value={project.clientEmail || ''}
                  onChange={e => updateField('clientEmail', e.target.value)}
                  placeholder="intermaxsrilanka@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Deliverables & Scope on Invoice */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wider pb-1 border-b border-neutral-100">
              <FileText className="w-3.5 h-3.5 text-[#FF8C00]" />
              <span>Scope & Deliverables (Visible to Client)</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Service Task Title</label>
              <input
                type="text"
                value={project.serviceTitle || ''}
                onChange={e => updateField('serviceTitle', e.target.value)}
                placeholder="Google Workspace File Sync Implementation"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Description Notes</label>
              <textarea
                rows={3}
                value={project.serviceDescription || ''}
                onChange={e => updateField('serviceDescription', e.target.value)}
                placeholder="Configuring common drive for enabling shared folder access among 3 laptops. Includes technical review, user requirement gathering, architecture planning, system configuration, and handover walkthrough. One-time fixed fee as per agreed quotation."
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00] resize-none"
              />
            </div>

            {/* Line items list */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-neutral-600">Line Items Breakdown</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs font-semibold text-[#FF8C00] hover:text-[#e07b00] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              </div>

              <div className="border border-neutral-200 rounded-lg overflow-hidden divide-y divide-neutral-100">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-2.5 bg-white space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder={`Task ${idx + 1} title / description...`}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded text-neutral-900 focus:outline-none focus:border-[#FF8C00]"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 rounded hover:bg-neutral-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-neutral-400">Qty / Hours</span>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity || ''}
                          onChange={e => updateItem(item.id, 'quantity', Number(e.target.value) || 0)}
                          placeholder="1"
                          className="w-full px-2 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded text-neutral-900 font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400">Amount (LKR)</span>
                        <input
                          type="number"
                          min="0"
                          value={item.amount || item.unitPrice || ''}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            updateItem(item.id, 'amount', val);
                            updateItem(item.id, 'unitPrice', val);
                          }}
                          placeholder="30000"
                          className="w-full px-2 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded text-neutral-900 font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount & Total */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Discount (LKR)</label>
                <input
                  type="number"
                  min="0"
                  value={project.discount || ''}
                  onChange={e => {
                    const d = Number(e.target.value) || 0;
                    setProject(prev => ({
                      ...prev,
                      discount: d,
                      total: Math.max(0, (prev.subtotal || 0) - d),
                    }));
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Total Amount (LKR)</label>
                <input
                  type="number"
                  value={project.total || ''}
                  onChange={e => updateField('total', Number(e.target.value) || 0)}
                  placeholder="30000"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 font-mono font-bold"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Spreadsheet Cost & Profit Distribution (Internal) */}
          <section className="space-y-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
            <button
              type="button"
              onClick={() => setShowInternalDistribution(!showInternalDistribution)}
              className="w-full flex items-center justify-between text-xs font-bold text-neutral-900 uppercase tracking-wider"
            >
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span>Internal Distribution (Spreadsheet Columns)</span>
              </div>
              {showInternalDistribution ? (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              )}
            </button>

            {showInternalDistribution && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">Broker Name</label>
                    <input
                      type="text"
                      value={project.brokerName || ''}
                      onChange={e => updateField('brokerName', e.target.value)}
                      placeholder="e.g. Hasangi"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">Broker Fee (LKR)</label>
                    <input
                      type="number"
                      value={project.brokerFee || ''}
                      onChange={e => updateField('brokerFee', Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">Outsource Worker Name</label>
                    <input
                      type="text"
                      value={project.outsourceWorkerName || ''}
                      onChange={e => updateField('outsourceWorkerName', e.target.value)}
                      placeholder="e.g. sahan / malaka"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-500 mb-1">Outsource Fee (LKR)</label>
                    <input
                      type="number"
                      value={project.outsourceWorkerFee || ''}
                      onChange={e => updateField('outsourceWorkerFee', Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700">My Profit (Rusiru):</span>
                  <span className="font-bold text-neutral-900 font-mono">{formatLKR(project.myProfit)}</span>
                </div>
              </div>
            )}
          </section>

          {/* Section 5: Notes & Terms */}
          <section className="space-y-2">
            <label className="block text-xs font-medium text-neutral-600">Notes & Terms (Optional)</label>
            <textarea
              rows={2}
              value={project.notes || ''}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Custom terms or notes for this invoice..."
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#FF8C00] resize-none"
            />
          </section>
        </div>

        {/* ── RIGHT: Live Invoice Document Preview ───────────── */}
        <div className="flex-1 bg-neutral-100 overflow-y-auto flex flex-col items-center py-6 px-4">
          <div className="no-print mb-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
            Document Live Preview
          </div>

          {/* Printable A4 Paper Container */}
          <div
            ref={printRef}
            id="printable-invoice"
            className="print-container w-full max-w-[760px] min-h-[1020px] bg-white text-neutral-900 p-10 md:p-12 shadow-[0_2px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border border-neutral-200/80 rounded-sm flex flex-col justify-between select-text"
            style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
          >
            {/* Top Main Section */}
            <div>
              {/* Header: Brand on left, Invoice details on right */}
              <div className="flex justify-between items-start pb-4">
                {/* Brand */}
                <div>
                  <div className="flex items-baseline text-2xl font-black tracking-tight leading-none">
                    <span className="text-neutral-900">Code</span>
                    <span className="text-[#FF8C00]">Crew</span>
                  </div>
                  <div className="text-xs font-bold text-neutral-900 mt-2">
                    Software Solutions
                  </div>
                  <div className="text-xs text-neutral-800 mt-1">R.H.V.R.Pramod</div>
                  <div className="text-xs text-neutral-700 mt-0.5">Mobile: 0755437148</div>
                  <div className="text-xs text-neutral-700 mt-0.5">Email: rusirupramod@gmail.com</div>
                </div>

                {/* Invoice Title & Meta */}
                <div className="text-right">
                  <div className="text-2xl font-black text-neutral-900 tracking-wider uppercase">
                    INVOICE
                  </div>
                  <div className="text-xs text-neutral-800 mt-2 font-mono">
                    # {project.invoiceNumber ? project.invoiceNumber.replace(/^#\s*/, '') : 'CC-INV-2026-001'}
                  </div>
                  <div className="text-xs text-neutral-700 mt-1">
                    Date: {formattedDate}
                  </div>
                  {project.refQuotation ? (
                    <div className="text-xs text-neutral-700 mt-1">
                      Ref Quotation: {project.refQuotation}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Full-width Divider Line */}
              <div className="w-full border-b border-black my-5"></div>

              {/* BILLED TO */}
              <div className="mb-6">
                <div className="text-[11px] font-bold text-neutral-900 uppercase tracking-wider mb-1">
                  BILLED TO
                </div>
                <div className="w-48 border-b border-black mb-3"></div>

                <div className="text-xs font-bold text-neutral-950">
                  {project.clientCompany || project.clientName || 'Client Name / Company'}
                </div>
                {project.clientAttn ? (
                  <div className="text-xs text-neutral-800 mt-0.5">
                    Attn: {project.clientAttn}
                  </div>
                ) : null}
                {project.clientAddress ? (
                  <div className="text-xs text-neutral-700 mt-0.5 whitespace-pre-line leading-relaxed">
                    {project.clientAddress}
                  </div>
                ) : null}
                {project.clientPhone ? (
                  <div className="text-xs text-neutral-700 mt-0.5">
                    <span className="font-semibold text-neutral-900">Phone: </span>
                    {project.clientPhone}
                  </div>
                ) : null}
                {project.clientEmail ? (
                  <div className="text-xs text-neutral-700 mt-0.5">
                    <span className="font-semibold text-neutral-900">Email: </span>
                    {project.clientEmail}
                  </div>
                ) : null}
              </div>

              {/* Table with 1px black border */}
              <div className="w-full border border-black mb-6">
                {/* Table Header */}
                <div className="flex border-b border-black text-[11px] font-bold text-neutral-900 uppercase">
                  <div className="flex-1 p-2 border-r border-black">
                    DESCRIPTION
                  </div>
                  <div className="w-36 p-2 text-right">
                    AMOUNT (LKR)
                  </div>
                </div>

                {/* Table Row(s) */}
                <div className="flex border-b border-black min-h-[90px]">
                  <div className="flex-1 p-2.5 border-r border-black text-xs">
                    <div className="font-bold text-neutral-950 mb-1.5 text-xs">
                      {project.serviceTitle || project.projectName || 'Service Implementation'}
                    </div>
                    <p className="text-neutral-700 leading-relaxed text-xs">
                      {project.serviceDescription ||
                        'Configuring common drive for enabling shared folder access. Includes technical review, user requirement gathering, architecture planning, system configuration, and handover walkthrough.'}
                    </p>
                  </div>
                  <div className="w-36 p-2.5 text-right font-mono text-xs flex items-center justify-end">
                    {Number(subtotal || project.total || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex border-b border-black text-xs">
                  <div className="flex-1 p-2 text-right border-r border-black">
                    Subtotal
                  </div>
                  <div className="w-36 p-2 text-right font-mono">
                    {Number(subtotal || project.total || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* Discount if present */}
                {discount > 0 && (
                  <div className="flex border-b border-black text-xs">
                    <div className="flex-1 p-2 text-right border-r border-black">
                      Discount
                    </div>
                    <div className="w-36 p-2 text-right font-mono text-red-600">
                      - {Number(discount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                )}

                {/* TOTAL DUE */}
                <div className="flex text-xs font-bold">
                  <div className="flex-1 p-2 text-right border-r border-black uppercase">
                    TOTAL DUE
                  </div>
                  <div className="w-36 p-2 text-right font-mono">
                    LKR {Number(grandTotal).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              {/* PAYMENT / BENEFICIARY DETAILS */}
              <div className="border border-black p-3.5 w-64 text-xs mb-8">
                <div className="font-bold text-neutral-950 uppercase pb-1 mb-2 border-b border-black text-[10px] tracking-wide">
                  PAYMENT / BENEFICIARY DETAILS
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold text-neutral-900">Bank Name: </span>
                    <span className="text-neutral-800">BOC (Bank of Ceylon)</span>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">Account Name: </span>
                    <span className="text-neutral-800">R.H.V.R.Pramod</span>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">Account No: </span>
                    <span className="text-neutral-800 font-mono">89121867</span>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">Branch: </span>
                    <span className="text-neutral-800">Weligama</span>
                  </div>
                </div>
              </div>

              {/* Notes block if present */}
              {project.notes ? (
                <div className="text-[11px] text-neutral-600 mb-6 leading-relaxed">
                  <span className="font-semibold text-neutral-900">Notes & Terms: </span>
                  {project.notes}
                </div>
              ) : null}

              {/* Centered Thank You Message */}
              <div className="text-center text-xs text-neutral-700 pt-3">
                Thank you for your business! If you have any questions regarding this invoice, please contact us.
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-8 border-t border-neutral-100 mt-6">
              <span>CodeCrew Software Solutions</span>
              <span>Invoice #{project.invoiceNumber ? project.invoiceNumber.replace(/^#\s*/, '') : 'CC-INV-2026-001'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Print Styling */}
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
            padding: 15mm 20mm !important;
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
