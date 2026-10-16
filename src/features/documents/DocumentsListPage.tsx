import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { getStatusBadge } from '../../components/ui/Badge';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { Document as DocumentType, DocumentItem, Customer, Settings, Project } from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export const DocumentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'invoice' | 'quotation'>('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Preview Modal state
  const [previewDocData, setPreviewDocData] = useState<{
    document: DocumentType;
    items: DocumentItem[];
    customer: Customer;
    project?: Project;
  } | null>(null);

  const [deletingDoc, setDeletingDoc] = useState<DocumentType | null>(null);

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

  // Load Documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', searchTerm, typeFilter, statusFilter],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: '1',
            type: 'invoice' as const,
            number: 'INV-2026-001',
            project_id: '00000000-0000-0000-0000-000000000010',
            customer_id: '00000000-0000-0000-0000-000000000005',
            status: 'partially_paid' as const,
            issue_date: '2026-10-15',
            due_date: '2026-10-29',
            discount: 0,
            notes: null,
            total: 30000,
            share_token: 'demo-share-token',
            pdf_path: null,
            sent_at: '2026-10-15T12:00:00Z',
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            customers: { name: 'Shamshard Marikkar', company: 'InterMax (Pvt) Ltd.', phone: '94772078626' },
            projects: { name: 'Google Workspace File Sync' },
          },
        ];
      }

      let query = supabase
        .from('documents')
        .select('*, customers(*), projects(*)')
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`number.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Open Preview Modal: fetch line items and full customer/project details
  const handleOpenPreview = async (doc: any) => {
    try {
      if (!isSupabaseConfigured) {
        setPreviewDocData({
          document: doc,
          items: [
            {
              id: '1',
              document_id: doc.id,
              position: 0,
              task: 'Technical Review',
              description: 'Audit current storage, bandwidth quotas and admin roles.',
              hours: 3,
              price: 7500,
              show_included: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: '2',
              document_id: doc.id,
              position: 1,
              task: 'Requirement & Architecture',
              description: 'Design department folders and permission tiers.',
              hours: 4,
              price: 10000,
              show_included: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: '3',
              document_id: doc.id,
              position: 2,
              task: 'Configuration Part',
              description: 'Implement Google Drive client and staff sync testing.',
              hours: 5,
              price: 12500,
              show_included: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          customer: doc.customers || {
            id: 'c1',
            name: 'Shamshard Marikkar',
            company: 'InterMax (Pvt) Ltd.',
            phone: '94772078626',
            email: 'intermaxsrilanka@gmail.com',
            address: 'Battaramulla',
            created_by: null,
            created_at: '',
            updated_at: '',
          },
          project: doc.projects || {
            id: 'p1',
            name: 'Google Workspace File Sync',
            customer_id: 'c1',
            project_date: '2026-10-15',
            price: 30000,
            status: 'active',
            notes: null,
            created_by: null,
            created_at: '',
            updated_at: '',
          },
        });
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from('document_items')
        .select('*')
        .eq('document_id', doc.id)
        .order('position', { ascending: true });
      if (itemsError) throw itemsError;

      setPreviewDocData({
        document: doc,
        items: items || [],
        customer: doc.customers,
        project: doc.projects,
      });
    } catch (err: any) {
      toast.error('Failed to prepare document preview');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
      setDeletingDoc(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete document');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Invoices & Quotations
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Generate, preview and send client bills via WhatsApp in 2-3 clicks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/documents/new?type=quotation')}
          >
            Create Quotation
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/documents/new?type=invoice')}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-border shadow-xs">
        <div className="relative">
          <Input
            placeholder="Search by document number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-9 text-xs"
          />
        </div>

        <Select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as any)}
          className="h-9 text-xs"
        >
          <option value="all">All Document Types</option>
          <option value="invoice">Invoices Only</option>
          <option value="quotation">Quotations Only</option>
        </Select>

        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 text-xs"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Documents Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No documents found"
          description="Create your first quotation or invoice with line items."
          actionLabel="Create Invoice"
          onAction={() => navigate('/documents/new?type=invoice')}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Document No.</TableHead>
              <TableHead>Client / Project</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead className="text-right">Total (LKR)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc: any) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <span className="capitalize font-bold text-xs text-neutral-800">
                    {doc.type}
                  </span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(doc)}
                    className="font-bold text-neutral-900 hover:text-[#FF8C00] transition-colors"
                  >
                    {doc.number}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-xs text-neutral-900">
                    {doc.customers?.name || '-'}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {doc.projects?.name || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-neutral-600">
                  {formatDate(doc.issue_date)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-bold text-neutral-950">
                  {formatLKR(doc.total)}
                </TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPreview(doc)}
                      title="Preview & WhatsApp Send"
                      className="text-emerald-700 hover:bg-emerald-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      title="Edit Document"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingDoc(doc)}
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Preview & WhatsApp Modal */}
      {previewDocData && settings && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDocData)}
          onClose={() => setPreviewDocData(null)}
          document={previewDocData.document}
          items={previewDocData.items}
          customer={previewDocData.customer}
          project={previewDocData.project}
          settings={settings}
          onDocumentSent={() => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        onConfirm={() => deletingDoc && deleteMutation.mutate(deletingDoc.id)}
        title="Delete Document"
        message={`Are you sure you want to delete ${deletingDoc?.number}?`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
