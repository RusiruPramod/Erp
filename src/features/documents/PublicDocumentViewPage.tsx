import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pdf } from '@react-pdf/renderer';
import { Download, CheckCircle, FileText, Building2, Phone, Mail, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { getStatusBadge } from '../../components/ui/Badge';
import { CodeCrewPdfDocument } from '../../lib/pdf-document';
import { formatLKR, formatDate } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

export const PublicDocumentViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-doc', token],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        throw new Error('Document not found or database not configured.');
      }

      // Fetch document by share_token
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('share_token', token)
        .single();
      if (docError || !doc) throw new Error('Document not found or link has expired.');

      // Fetch items
      const { data: items } = await supabase
        .from('document_items')
        .select('*')
        .eq('document_id', doc.id)
        .order('position', { ascending: true });

      // Fetch customer
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', doc.customer_id)
        .single();

      // Fetch project
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', doc.project_id)
        .single();

      // Fetch settings
      const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

      return {
        document: doc,
        items: items || [],
        customer: customer!,
        project: project!,
        settings: settings!,
      };
    },
  });

  const handleDownload = async () => {
    if (!data) return;
    try {
      setIsDownloading(true);
      const doc = (
        <CodeCrewPdfDocument
          document={data.document}
          items={data.items}
          customer={data.customer}
          project={data.project}
          settings={data.settings}
        />
      );
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${data.document.number}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Document downloaded');
    } catch (err: any) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF8C00] mx-auto" />
          <p className="text-sm text-neutral-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <FileText className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-neutral-900">Document Unavailable</h2>
          <p className="text-xs text-neutral-500 mt-2">
            This invoice or quotation link may have expired or is invalid. Please contact CodeCrew.
          </p>
        </div>
      </div>
    );
  }

  const { document, items, customer, project, settings } = data;
  const isInvoice = document.type === 'invoice';

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-[#111111]">Code</span>
            <span className="text-2xl font-black text-[#FF8C00]">Crew</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownload}
            isLoading={isDownloading}
          >
            Download PDF
          </Button>
        </div>

        {/* Main Document Presentation */}
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-10 shadow-sm space-y-8">
          {/* Doc Title & Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-border pb-6 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF8C00]">
                Official {document.type}
              </span>
              <h1 className="text-2xl font-black text-neutral-900 mt-1">
                {document.number}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Project: <span className="font-semibold text-neutral-800">{project?.name}</span>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div>{getStatusBadge(document.status)}</div>
              <p className="text-xs text-neutral-500">
                Issue Date: <span className="font-semibold text-neutral-800">{formatDate(document.issue_date)}</span>
              </p>
              {isInvoice && document.due_date && (
                <p className="text-xs text-neutral-500">
                  Due Date: <span className="font-semibold text-neutral-800">{formatDate(document.due_date)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Two Columns: From & Bill To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <p className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-2 border-b border-neutral-200 pb-1">
                From
              </p>
              <p className="font-bold text-sm text-neutral-900">{settings.business_name}</p>
              {settings.owner_name && <p className="text-neutral-600">{settings.owner_name}</p>}
              {settings.mobile && <p className="text-neutral-600">Mobile: {settings.mobile}</p>}
              {settings.email && <p className="text-neutral-600">Email: {settings.email}</p>}
              {settings.address && <p className="text-neutral-600">{settings.address}</p>}
            </div>

            <div>
              <p className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-2 border-b border-neutral-200 pb-1">
                Bill To
              </p>
              <p className="font-bold text-sm text-neutral-900">{customer.name}</p>
              {customer.company && <p className="text-neutral-600 font-medium">{customer.company}</p>}
              {customer.phone && <p className="text-neutral-600">Phone: {customer.phone}</p>}
              {customer.email && <p className="text-neutral-600">Email: {customer.email}</p>}
              {customer.address && <p className="text-neutral-600">{customer.address}</p>}
            </div>
          </div>

          {/* Items Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Task</TableHead>
                <TableHead>Description Notes</TableHead>
                <TableHead className="text-center">Est. Hours</TableHead>
                <TableHead className="text-right">Price (LKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold text-neutral-900 text-xs">
                    {item.task}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-600">
                    {item.description || '-'}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {item.hours !== null ? `${item.hours}h` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">
                    {item.show_included && Number(item.price) === 0
                      ? 'Included'
                      : formatLKR(item.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Bottom Section: Bank Details & Total Amount Due */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            {/* Payment Details */}
            <div className="bg-surface-subtle p-4 rounded-xl border border-border text-xs space-y-2">
              <p className="font-bold text-neutral-800 uppercase tracking-wider text-[10px]">
                Beneficiary & Bank Details
              </p>
              <div className="grid grid-cols-2 gap-1 text-neutral-600">
                <span className="text-neutral-400">Bank:</span>
                <span className="font-semibold text-neutral-800">{settings.bank_name}</span>

                <span className="text-neutral-400">Branch:</span>
                <span className="font-semibold text-neutral-800">{settings.bank_branch}</span>

                <span className="text-neutral-400">Account Name:</span>
                <span className="font-semibold text-neutral-800">{settings.bank_account_name}</span>

                <span className="text-neutral-400">Account No:</span>
                <span className="font-mono font-bold text-neutral-900">{settings.bank_account_number}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex flex-col justify-center text-right space-y-1">
              <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                {isInvoice ? 'Total Amount Due' : 'Total Quotation'}
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#FF8C00] font-mono">
                {formatLKR(document.total)}
              </p>
            </div>
          </div>

          {/* Terms & Notes */}
          {(document.notes || settings.default_invoice_notes) && (
            <div className="pt-4 border-t border-border text-xs text-neutral-500 space-y-1">
              <p className="font-bold text-neutral-700 uppercase tracking-wider text-[10px]">
                Notes & Terms
              </p>
              <p>{document.notes || settings.default_invoice_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
