import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  FileCheck,
  Percent,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { Document as DocumentType, DocumentItem, Customer, Settings, Project } from '../../types';
import { formatLKR, formatDateInput } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

interface EditableItem {
  id?: string;
  task: string;
  description: string;
  hours: string;
  price: string;
  show_included: boolean;
}

export const DocumentEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isNew = !id || id === 'new';
  const defaultType = (searchParams.get('type') as 'quotation' | 'invoice') || 'invoice';
  const defaultProjectId = searchParams.get('project_id');

  // Form State
  const [docType, setDocType] = useState<'quotation' | 'invoice'>(defaultType);
  const [docNumber, setDocNumber] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [issueDate, setIssueDate] = useState(formatDateInput(new Date()));
  const [dueDate, setDueDate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<EditableItem[]>([
    { task: '', description: '', hours: '', price: '0', show_included: false },
  ]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load Settings
  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return {
          id: 1,
          business_name: 'CodeCrew',
          owner_name: 'R.H.V.R.Pramod',
          mobile: '0755437148',
          email: 'rusirupramod@gmail.com',
          address: 'Sri Lanka',
          logo_primary_color: '#FF8C00',
          logo_secondary_color: '#111111',
          bank_account_name: 'R.H.V.R.Pramod',
          bank_account_number: '89121867',
          bank_name: 'BOC (Bank of Ceylon)',
          bank_branch: 'Weligama',
          default_invoice_notes:
            'This fee covers only the review, planning, and configuration services listed. Third-party subscriptions, domain charges, and storage upgrades are not included.',
          whatsapp_invoice_template:
            'Hello {customer}, please find your Invoice {number} for {project}. Total: LKR {total}. View/download: {link}. Thank you, CodeCrew.',
          whatsapp_quotation_template:
            'Hello {customer}, please find your Quotation {number} for {project}. Total: LKR {total}. View/download: {link}. Thank you, CodeCrew.',
          invoice_prefix: 'INV',
          quotation_prefix: 'QUO',
          updated_at: new Date().toISOString(),
        };
      }
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return data;
    },
  });

  // Load Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-select'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, customer_id, price, notes')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Load Customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // If editing an existing document, load it
  const { data: existingDoc } = useQuery({
    queryKey: ['document-edit', id],
    queryFn: async () => {
      if (isNew || !isSupabaseConfigured) return null;
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      if (docError) throw docError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('document_items')
        .select('*')
        .eq('document_id', id)
        .order('position', { ascending: true });
      if (itemsError) throw itemsError;

      return { doc, items: itemsData || [] };
    },
    enabled: !isNew,
  });

  // Populate state from existing document or defaults
  useEffect(() => {
    if (existingDoc) {
      const { doc, items: itemsData } = existingDoc;
      setDocType(doc.type);
      setDocNumber(doc.number);
      setProjectId(doc.project_id);
      setCustomerId(doc.customer_id);
      setStatus(doc.status);
      setIssueDate(formatDateInput(doc.issue_date));
      setDueDate(doc.due_date ? formatDateInput(doc.due_date) : '');
      setDiscount(String(doc.discount || '0'));
      setNotes(doc.notes || '');
      setItems(
        itemsData.map(it => ({
          id: it.id,
          task: it.task,
          description: it.description || '',
          hours: it.hours !== null ? String(it.hours) : '',
          price: String(it.price),
          show_included: it.show_included,
        }))
      );
    } else if (isNew) {
      if (settings?.default_invoice_notes && !notes) {
        setNotes(settings.default_invoice_notes);
      }
      // If project_id provided in query params, auto-fill
      if (defaultProjectId && projects.length > 0) {
        const found = projects.find(p => p.id === defaultProjectId);
        if (found) {
          setProjectId(found.id);
          setCustomerId(found.customer_id);
          setItems([
            {
              task: found.name,
              description: found.notes || 'Full deliverable scope & configuration services',
              hours: '',
              price: String(found.price),
              show_included: false,
            },
          ]);
        }
      }
    }
  }, [existingDoc, isNew, defaultProjectId, projects, settings]);

  // When project changes in dropdown, auto-fill customer and initial item
  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId);
    const p = projects.find(item => item.id === newProjId);
    if (p) {
      setCustomerId(p.customer_id);
      if (items.length === 1 && !items[0].task) {
        setItems([
          {
            task: p.name,
            description: p.notes || 'Implementation & service deliverable',
            hours: '',
            price: String(p.price),
            show_included: false,
          },
        ]);
      }
    }
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.price) || 0), 0);
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal);

  const addItemRow = () => {
    setItems([
      ...items,
      { task: '', description: '', hours: '', price: '0', show_included: false },
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: keyof EditableItem, val: any) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    setItems(next);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('Please select a project');
      if (!customerId) throw new Error('Please select a customer');
      if (items.some(it => !it.task.trim())) {
        throw new Error('All line items must have a Service Task specified');
      }

      let generatedNumber = docNumber;
      if (!generatedNumber && isSupabaseConfigured) {
        // Fetch atomic sequential number from RPC
        const { data: num, error: numError } = await supabase.rpc('next_document_number', {
          p_type: docType,
        });
        if (numError) throw numError;
        generatedNumber = num;
        setDocNumber(num);
      } else if (!generatedNumber) {
        generatedNumber = `${docType === 'invoice' ? 'INV' : 'QUO'}-2026-001`;
      }

      const docPayload = {
        type: docType,
        number: generatedNumber,
        project_id: projectId,
        customer_id: customerId,
        status: status as any,
        issue_date: issueDate,
        due_date: docType === 'invoice' && dueDate ? dueDate : null,
        discount: discountVal,
        notes: notes || null,
        total: grandTotal,
        created_by: user?.id || null,
      };

      if (!isSupabaseConfigured) {
        return { id: id || 'doc-new', ...docPayload };
      }

      let savedDocId = id;
      if (isNew) {
        const { data: created, error: createError } = await supabase
          .from('documents')
          .insert(docPayload)
          .select()
          .single();
        if (createError) throw createError;
        savedDocId = created.id;
      } else {
        const { error: updateError } = await supabase
          .from('documents')
          .update(docPayload)
          .eq('id', id);
        if (updateError) throw updateError;
      }

      // Delete old items and insert fresh
      await supabase.from('document_items').delete().eq('document_id', savedDocId);

      const itemsPayload = items.map((it, idx) => ({
        document_id: savedDocId,
        position: idx,
        task: it.task.trim(),
        description: it.description.trim() || null,
        hours: it.hours ? parseFloat(it.hours) : null,
        price: parseFloat(it.price) || 0,
        show_included: it.show_included,
      }));

      const { error: itemsError } = await supabase
        .from('document_items')
        .insert(itemsPayload);
      if (itemsError) throw itemsError;

      return { id: savedDocId, ...docPayload };
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['project-documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`${docType === 'invoice' ? 'Invoice' : 'Quotation'} saved successfully`);
      if (isNew && saved?.id) {
        navigate(`/documents/${saved.id}`, { replace: true });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save document');
    },
  });

  // Convert Quotation to Invoice in 1 Click
  const handleConvertToInvoice = async () => {
    try {
      if (docType !== 'quotation') return;
      if (!isSupabaseConfigured) {
        setDocType('invoice');
        setDocNumber('INV-2026-002');
        toast.success('Converted quotation to invoice');
        return;
      }

      // Generate next invoice number
      const { data: invNum, error: numError } = await supabase.rpc('next_document_number', {
        p_type: 'invoice',
      });
      if (numError) throw numError;

      setDocType('invoice');
      setDocNumber(invNum);
      setStatus('draft');
      toast.success(`Converted to Invoice ${invNum}. Save to confirm.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to convert quotation');
    }
  };

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedProject = projects.find(p => p.id === projectId);

  const currentDocObj: DocumentType = {
    id: id || 'temp',
    type: docType,
    number: docNumber || `${docType === 'invoice' ? 'INV' : 'QUO'}-2026-001`,
    project_id: projectId,
    customer_id: customerId,
    status: status as any,
    issue_date: issueDate,
    due_date: dueDate || null,
    discount: discountVal,
    notes,
    total: grandTotal,
    share_token: (existingDoc as any)?.doc?.share_token || 'demo-token',
    pdf_path: null,
    sent_at: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const currentDocItems: DocumentItem[] = items.map((it, idx) => ({
    id: it.id || `item-${idx}`,
    document_id: id || 'temp',
    position: idx,
    task: it.task,
    description: it.description || null,
    hours: it.hours ? parseFloat(it.hours) : null,
    price: parseFloat(it.price) || 0,
    show_included: it.show_included,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Documents</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight capitalize">
              {isNew ? `New ${docType}` : `Edit ${docType}: ${docNumber || ''}`}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Convert Quotation to Invoice */}
          {docType === 'quotation' && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileCheck className="w-4 h-4 text-emerald-600" />}
              onClick={handleConvertToInvoice}
            >
              Convert to Invoice
            </Button>
          )}

          {/* Preview & Send Modal */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => setIsPreviewOpen(true)}
            disabled={!customerId || !projectId}
          >
            Preview PDF
          </Button>

          {/* Save Button */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={() => saveMutation.mutate()}
            isLoading={saveMutation.isPending}
          >
            Save Document
          </Button>
        </div>
      </div>

      {/* Main Form Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Items (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Line Items</h2>
                <p className="text-xs text-neutral-400">
                  Service tasks, hours breakdown, and price line items.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={addItemRow}
              >
                Add Row
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border bg-surface-subtle space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <Input
                        label="Service Task"
                        placeholder="e.g. Technical Review / Requirement Architecture"
                        value={item.task}
                        onChange={e => updateItemRow(idx, 'task', e.target.value)}
                        className="text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-4 flex items-end justify-between gap-2">
                      <div className="flex-1">
                        <Input
                          label="Est. Hours (Optional)"
                          type="number"
                          step="0.5"
                          placeholder="e.g. 3.0"
                          value={item.hours}
                          onChange={e => updateItemRow(idx, 'hours', e.target.value)}
                          className="text-xs text-center"
                        />
                      </div>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemRow(idx)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-7">
                      <Input
                        label="Description Notes"
                        placeholder="Detailed deliverables for this phase..."
                        value={item.description}
                        onChange={e => updateItemRow(idx, 'description', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        label="Price (LKR)"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.price}
                        onChange={e => updateItemRow(idx, 'price', e.target.value)}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2 pt-4">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-neutral-600">
                        <input
                          type="checkbox"
                          checked={item.show_included}
                          onChange={e => updateItemRow(idx, 'show_included', e.target.checked)}
                          className="rounded text-[#FF8C00] focus:ring-[#FF8C00]"
                        />
                        <span>Included</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Discount Calculation */}
            <div className="mt-6 pt-4 border-t border-border space-y-2 text-right">
              <div className="flex justify-end gap-6 text-xs text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold w-32">{formatLKR(subtotal)}</span>
              </div>
              <div className="flex justify-end items-center gap-4 text-xs text-neutral-600">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-neutral-400" />
                  Discount (LKR):
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="w-32 rounded-lg border border-border px-2.5 py-1 text-right text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
                />
              </div>
              <div className="flex justify-end gap-6 text-sm font-black text-neutral-900 pt-2 border-t border-border">
                <span>Total Amount Due:</span>
                <span className="font-mono text-[#FF8C00] text-base w-32">
                  {formatLKR(grandTotal)}
                </span>
              </div>
            </div>
          </Card>

          {/* Terms & Notes */}
          <Card>
            <Textarea
              label="Invoice Terms & Notes"
              placeholder="Payment terms, exclusions, bank transfer instructions..."
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Card>
        </div>

        {/* Right Column: Document Details (1 Col) */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 border-b border-border pb-3">
              Document Setup
            </h2>

            {/* Type */}
            <Select
              label="Document Type"
              value={docType}
              onChange={e => setDocType(e.target.value as any)}
            >
              <option value="invoice">Invoice</option>
              <option value="quotation">Quotation</option>
            </Select>

            {/* Project */}
            <Select
              label="Linked Project"
              value={projectId}
              onChange={e => handleProjectChange(e.target.value)}
            >
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            {/* Customer */}
            <Select
              label="Client / Customer"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
            >
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </Select>

            {/* Document Number */}
            <Input
              label="Document Number"
              placeholder="Auto-generated (e.g. INV-2026-001)"
              helperText="Auto-assigned sequentially per-year upon save"
              value={docNumber}
              onChange={e => setDocNumber(e.target.value)}
            />

            {/* Status */}
            <Select
              label="Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {docType === 'invoice' ? (
                <>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </>
              ) : (
                <>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </>
              )}
            </Select>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Issue Date"
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
              />

              {docType === 'invoice' && (
                <Input
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Live Preview Modal */}
      {selectedCustomer && settings && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          document={currentDocObj}
          items={currentDocItems}
          customer={selectedCustomer}
          project={selectedProject}
          settings={settings}
        />
      )}
    </div>
  );
};
