import React, { useRef } from 'react';
import { StudioProjectRow } from './types';
import { Printer, Download, MessageCircle, Copy, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatLKR } from '../../lib/formatters';
import { toast } from 'sonner';

interface LiveInvoicePreviewProps {
  project: StudioProjectRow;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNo: string;
    branch: string;
  };
  ownerDetails?: {
    businessName: string;
    tagline: string;
    ownerName: string;
    mobile: string;
    email: string;
  };
}

export const LiveInvoicePreview: React.FC<LiveInvoicePreviewProps> = ({
  project,
  bankDetails = {
    bankName: 'BOC (Bank of Ceylon)',
    accountName: 'R.H.V.R.Pramod',
    accountNo: '89121867',
    branch: 'Weligama',
  },
  ownerDetails = {
    businessName: 'CodeCrew',
    tagline: 'Software Solutions',
    ownerName: 'R.H.V.R.Pramod',
    mobile: '0755437148',
    email: 'rusirupramod@gmail.com',
  },
}) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Format Date (e.g. 15 October 2026)
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

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const phone = (project.clientPhone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '94' + phone.substring(1) : phone.startsWith('94') ? phone : '94' + phone;
    
    const message = `*INVOICE: ${project.invoiceNumber}*\n` +
      `*Client:* ${project.clientName || project.clientCompany || 'Valued Client'}\n` +
      `*Project:* ${project.projectName}\n` +
      `*Total Due:* ${formatLKR(project.total)}\n\n` +
      `*Bank Details:*\n` +
      `Bank: ${bankDetails.bankName}\n` +
      `Account Name: ${bankDetails.accountName}\n` +
      `Account No: ${bankDetails.accountNo}\n` +
      `Branch: ${bankDetails.branch}\n\n` +
      `Thank you for your business!\nCodeCrew Software Solutions`;

    const encoded = encodeURIComponent(message);
    const url = cleanPhone.length > 5 ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp with invoice details');
  };

  const handleCopySummary = () => {
    const text = `INVOICE ${project.invoiceNumber} | ${project.projectName} | Amount: ${formatLKR(project.total)} | Bank: ${bankDetails.bankName} - ${bankDetails.accountNo}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Invoice summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#333333] p-3 md:p-5 overflow-y-auto rounded-xl">
      {/* Top Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-4 bg-neutral-900/90 text-white px-4 py-2.5 rounded-lg shadow-md border border-neutral-700">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Live Preview:</span>
          <span className="text-sm font-bold text-white font-mono">{project.invoiceNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopySummary}
            className="bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700 h-8 text-xs"
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700 h-8 text-xs"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print / PDF
          </Button>

          <Button
            size="sm"
            onClick={handleWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-medium"
            leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
          >
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Invoice Document Canvas (A4 Aspect Ratio Container) */}
      <div className="flex justify-center flex-1 pb-6">
        <div
          ref={printRef}
          id="printable-invoice"
          className="print-container w-full max-w-[794px] min-h-[1050px] bg-white text-[#111111] p-10 md:p-14 shadow-2xl rounded-sm flex flex-col justify-between select-text"
          style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
        >
          {/* Main Top Content */}
          <div>
            {/* Header: Company on Left, Invoice title on Right */}
            <div className="flex justify-between items-start border-b border-neutral-200 pb-5 mb-7">
              <div>
                <div className="flex items-baseline text-3xl font-black tracking-tight leading-none">
                  <span className="text-[#FF8C00]">Code</span>
                  <span className="text-[#111111]">Crew</span>
                </div>
                <div className="text-xs font-semibold text-neutral-800 tracking-wide mt-1.5 uppercase">
                  {ownerDetails.tagline}
                </div>
                <div className="text-xs text-neutral-700 mt-1">{ownerDetails.ownerName}</div>
                <div className="text-xs text-neutral-600 mt-0.5">Mobile: {ownerDetails.mobile}</div>
                <div className="text-xs text-neutral-600">Email: {ownerDetails.email}</div>
              </div>

              <div className="text-right">
                <h1 className="text-3xl font-black text-[#111111] tracking-widest uppercase">
                  INVOICE
                </h1>
                <div className="text-sm font-bold text-neutral-900 mt-1 font-mono">
                  # {project.invoiceNumber || 'CC-INV-2026-001'}
                </div>
                <div className="text-xs text-neutral-700 mt-0.5">
                  <span className="font-semibold">Date:</span> {formattedDate}
                </div>
                {project.refQuotation ? (
                  <div className="text-xs text-neutral-500 mt-0.5">
                    <span className="font-semibold">Ref Quotation:</span> {project.refQuotation}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Billed To Section */}
            <div className="mb-8">
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                BILLED TO
              </div>
              <div className="text-base font-bold text-neutral-900">
                {project.clientCompany || project.clientName || 'Client Name / Company'}
              </div>
              {project.clientAttn ? (
                <div className="text-xs text-neutral-800 mt-0.5">
                  Attn: {project.clientAttn}
                </div>
              ) : null}
              {project.clientAddress ? (
                <div className="text-xs text-neutral-600 mt-0.5 whitespace-pre-line max-w-sm">
                  {project.clientAddress}
                </div>
              ) : null}
              {project.clientPhone ? (
                <div className="text-xs text-neutral-600 mt-0.5">
                  Phone: {project.clientPhone}
                </div>
              ) : null}
              {project.clientEmail ? (
                <div className="text-xs text-neutral-600">
                  Email: {project.clientEmail}
                </div>
              ) : null}
            </div>

            {/* Line Item Table (Bordered Box matching the screenshot) */}
            <div className="border border-neutral-900 mb-6">
              {/* Table Header */}
              <div className="flex border-b border-neutral-900 bg-neutral-50/50 text-[11px] font-bold text-neutral-900 uppercase">
                <div className="flex-1 p-2.5 px-4 border-r border-neutral-900">
                  DESCRIPTION
                </div>
                <div className="w-36 p-2.5 px-4 text-right">
                  AMOUNT (LKR)
                </div>
              </div>

              {/* Table Body Line */}
              <div className="flex min-h-[140px] border-b border-neutral-900">
                <div className="flex-1 p-4 border-r border-neutral-900 text-xs">
                  <div className="font-bold text-neutral-950 text-sm mb-1.5">
                    {project.serviceTitle || project.projectName || 'Project Service Implementation'}
                  </div>
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-line text-xs">
                    {project.serviceDescription ||
                      'Configuring project deliverables as per client specification and agreed quotation. Includes technical development, testing, quality assurance, system setup, and handover walkthrough.'}
                  </p>
                </div>
                <div className="w-36 p-4 text-right font-bold text-sm text-neutral-950 font-mono">
                  {Number(project.total || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              {/* Subtotal Row */}
              <div className="flex border-b border-neutral-900 text-xs font-semibold">
                <div className="flex-1 p-2 px-4 border-r border-neutral-900 text-right">
                  Subtotal
                </div>
                <div className="w-36 p-2 px-4 text-right font-mono font-bold">
                  {Number(project.total || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              {/* TOTAL DUE Row */}
              <div className="flex text-sm font-black bg-neutral-100/60">
                <div className="flex-1 p-3 px-4 border-r border-neutral-900 text-right uppercase tracking-wider">
                  TOTAL DUE
                </div>
                <div className="w-36 p-3 px-4 text-right font-mono text-neutral-950 font-bold whitespace-nowrap">
                  LKR {Number(project.total || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Payment Details Box */}
          <div className="mt-8 pt-4">
            <div className="border border-neutral-900 p-4 max-w-sm rounded-none bg-white">
              <div className="text-[10px] font-black text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1 mb-2">
                PAYMENT / BENEFICIARY DETAILS
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex">
                  <span className="w-28 text-neutral-600 font-medium">Bank Name:</span>
                  <span className="font-bold text-neutral-900">{bankDetails.bankName}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-neutral-600 font-medium">Account Name:</span>
                  <span className="font-bold text-neutral-900">{bankDetails.accountName}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-neutral-600 font-medium">Account No:</span>
                  <span className="font-bold text-neutral-900 font-mono tracking-wide">{bankDetails.accountNo}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-neutral-600 font-medium">Branch:</span>
                  <span className="font-bold text-neutral-900">{bankDetails.branch}</span>
                </div>
              </div>
            </div>

            {project.notes ? (
              <div className="mt-4 text-[10px] text-neutral-500 italic max-w-lg">
                Note: {project.notes}
              </div>
            ) : null}
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
