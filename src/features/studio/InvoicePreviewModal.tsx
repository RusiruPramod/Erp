import React from 'react';
import { StudioProjectRow } from './types';
import { Modal } from '../../components/ui/Modal';
import { LiveInvoicePreview } from './LiveInvoicePreview';
import { Button } from '../../components/ui/Button';
import { Printer, Download, MessageCircle, X } from 'lucide-react';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: StudioProjectRow | null;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!isOpen || !project) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice Preview: ${project.invoiceNumber} - ${project.projectName}`}
      description="Live A4 print-ready invoice document with instant PDF export and client delivery."
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Render the clean LiveInvoicePreview inside the modal canvas */}
        <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-neutral-200">
          <LiveInvoicePreview project={project} />
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="text-xs text-neutral-500">
            Click <span className="font-semibold text-neutral-700">Print / PDF</span> to generate an official document or print to physical paper.
          </div>
          <Button variant="outline" size="sm" onClick={onClose} leftIcon={<X className="w-4 h-4" />}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
