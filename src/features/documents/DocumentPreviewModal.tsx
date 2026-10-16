import React, { useState } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CodeCrewPdfDocument } from '../../lib/pdf-document';
import { Document as DocumentType, DocumentItem, Customer, Settings, Project } from '../../types';
import { generateWhatsAppUrl } from '../../lib/whatsapp';
import { formatLKR } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Download,
  Share2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentType;
  items: DocumentItem[];
  customer: Customer;
  project?: Project;
  settings: Settings;
  onDocumentSent?: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  items,
  customer,
  project,
  settings,
  onDocumentSent,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  if (!isOpen) return null;

  // Build the public share URL
  const shareUrl = `${window.location.origin}/d/${document.share_token}`;

  const downloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const doc = (
        <CodeCrewPdfDocument
          document={document}
          items={items}
          customer={customer}
          project={project}
          settings={settings}
        />
      );
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.number}-${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate PDF download');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success('Public view link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendWhatsApp = async () => {
    try {
      setIsSendingWhatsApp(true);

      // Optional: upload generated PDF blob to Supabase storage documents bucket
      if (isSupabaseConfigured) {
        try {
          const doc = (
            <CodeCrewPdfDocument
              document={document}
              items={items}
              customer={customer}
              project={project}
              settings={settings}
            />
          );
          const asPdf = pdf(doc);
          const blob = await asPdf.toBlob();
          const filePath = `${document.type}s/${document.number}.pdf`;
          await supabase.storage.from('documents').upload(filePath, blob, {
            upsert: true,
          });

          // Mark document as sent in the database
          await supabase
            .from('documents')
            .update({
              status: document.status === 'draft' ? 'sent' : document.status,
              sent_at: new Date().toISOString(),
              pdf_path: filePath,
            })
            .eq('id', document.id);

          if (onDocumentSent) onDocumentSent();
        } catch (storageErr) {
          console.warn('Storage upload notice:', storageErr);
        }
      }

      // Generate WhatsApp link
      const template =
        document.type === 'invoice'
          ? settings.whatsapp_invoice_template
          : settings.whatsapp_quotation_template;

      const waUrl = generateWhatsAppUrl({
        customerName: customer.name,
        customerPhone: customer.phone,
        docType: document.type,
        docNumber: document.number,
        projectName: project?.name || 'Deliverables',
        total: document.total,
        shareUrl,
        template,
      });

      // Open wa.me in new tab
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      toast.success('WhatsApp click-to-chat opened');
    } catch (err: any) {
      toast.error('Could not prepare WhatsApp message');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${document.type.toUpperCase()}: ${document.number}`}
      description="Live PDF preview and instant client WhatsApp delivery."
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-subtle p-3 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={downloadPdf}
              isLoading={isGeneratingPdf}
            >
              Download PDF
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyLink}
            >
              {copiedLink ? 'Link Copied!' : 'Copy Share Link'}
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<MessageCircle className="w-4 h-4" />}
            onClick={handleSendWhatsApp}
            isLoading={isSendingWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Send via WhatsApp
          </Button>
        </div>

        {/* Live PDF Viewer */}
        <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-border bg-neutral-100 shadow-inner">
          <PDFViewer width="100%" height="100%" showToolbar={false} className="border-0">
            <CodeCrewPdfDocument
              document={document}
              items={items}
              customer={customer}
              project={project}
              settings={settings}
            />
          </PDFViewer>
        </div>
      </div>
    </Modal>
  );
};
