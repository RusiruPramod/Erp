import React from 'react';
import { StudioProjectRow } from './types';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Save, User, Building, Phone, Mail, MapPin, DollarSign, FileText } from 'lucide-react';
import { formatLKR } from '../../lib/formatters';

interface StudioRowDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  row: StudioProjectRow | null;
  onSave: (updated: StudioProjectRow) => void;
}

export const StudioRowDrawer: React.FC<StudioRowDrawerProps> = ({
  isOpen,
  onClose,
  row,
  onSave,
}) => {
  if (!row) return null;

  const [formState, setFormState] = React.useState<StudioProjectRow>(row);

  React.useEffect(() => {
    if (row) {
      setFormState(row);
    }
  }, [row]);

  const handleChange = (field: keyof StudioProjectRow, value: any) => {
    setFormState(prev => {
      const updated = { ...prev, [field]: value };

      // If broker, outsource, or myProfit changed, auto-update total
      if (field === 'brokerFee' || field === 'outsourceWorkerFee' || field === 'myProfit') {
        const b = field === 'brokerFee' ? Number(value) || 0 : Number(prev.brokerFee) || 0;
        const o = field === 'outsourceWorkerFee' ? Number(value) || 0 : Number(prev.outsourceWorkerFee) || 0;
        const p = field === 'myProfit' ? Number(value) || 0 : Number(prev.myProfit) || 0;
        updated.total = b + o + p;
      } else if (field === 'total') {
        // If total changed manually, adjust my profit
        const t = Number(value) || 0;
        const b = Number(prev.brokerFee) || 0;
        const o = Number(prev.outsourceWorkerFee) || 0;
        updated.myProfit = Math.max(0, t - b - o);
      }

      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Project & Invoice: ${formState.projectName || 'Project'}`}
      description="Update client details, description, and fee distribution for live invoice generation."
      maxWidth="2xl"
    >
      <form onSubmit={handleSave} className="space-y-5">
        {/* Project & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Project Name"
              value={formState.projectName}
              onChange={e => handleChange('projectName', e.target.value)}
              placeholder="e.g. Timer Pcb / Google Workspace Sync"
              required
            />
          </div>
          <div>
            <Input
              label="Date"
              type="date"
              value={formState.date}
              onChange={e => handleChange('date', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Client & Billing Details */}
        <div className="bg-neutral-50 p-4 rounded-xl border border-border space-y-3">
          <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#FF8C00]" />
            Billed To / Client Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Client / Company Name"
              value={formState.clientCompany || formState.clientName}
              onChange={e => {
                handleChange('clientCompany', e.target.value);
                handleChange('clientName', e.target.value);
              }}
              placeholder="e.g. InterMax (Pvt) Ltd."
              required
            />
            <Input
              label="Attention Person (Attn)"
              value={formState.clientAttn || ''}
              onChange={e => handleChange('clientAttn', e.target.value)}
              placeholder="e.g. Shamshard Marikkar (Managing Director)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Client Phone / WhatsApp"
              value={formState.clientPhone || ''}
              onChange={e => handleChange('clientPhone', e.target.value)}
              placeholder="e.g. +94 77 207 8626"
            />
            <Input
              label="Client Email"
              type="email"
              value={formState.clientEmail || ''}
              onChange={e => handleChange('clientEmail', e.target.value)}
              placeholder="e.g. client@example.com"
            />
          </div>

          <Textarea
            label="Billing Address"
            rows={2}
            value={formState.clientAddress || ''}
            onChange={e => handleChange('clientAddress', e.target.value)}
            placeholder="e.g. 435/2, Dutugemunu Rd, Koswatte, Battaramulla, Sri Lanka"
          />
        </div>

        {/* Invoice Item Details (What the client sees) */}
        <div className="bg-neutral-50 p-4 rounded-xl border border-border space-y-3">
          <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#FF8C00]" />
            Invoice Item Details (Shown to Client)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Invoice Number"
              value={formState.invoiceNumber}
              onChange={e => handleChange('invoiceNumber', e.target.value)}
              required
            />
            <Input
              label="Ref Quotation (Optional)"
              value={formState.refQuotation || ''}
              onChange={e => handleChange('refQuotation', e.target.value)}
              placeholder="e.g. CC-GWS-SYNC-2026-001"
            />
          </div>

          <Input
            label="Service Title on Invoice"
            value={formState.serviceTitle || ''}
            onChange={e => handleChange('serviceTitle', e.target.value)}
            placeholder="e.g. Google Workspace File Sync Implementation"
          />

          <Textarea
            label="Service Scope & Description"
            rows={3}
            value={formState.serviceDescription || ''}
            onChange={e => handleChange('serviceDescription', e.target.value)}
            placeholder="Detailed description of deliverables, walkthrough, etc."
          />
        </div>

        {/* Financial Distribution (Internal calculations - NOT visible to client on invoice) */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 space-y-3">
          <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              Internal Profit & Cost Distribution (Hidden on Invoice)
            </span>
            <span className="text-[11px] font-normal text-amber-700">Client only sees Total</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Broker Name"
              value={formState.brokerName || ''}
              onChange={e => handleChange('brokerName', e.target.value)}
              placeholder="e.g. Hasangi (leave blank if none)"
            />
            <Input
              label="Broker Fee (LKR)"
              type="number"
              value={formState.brokerFee || 0}
              onChange={e => handleChange('brokerFee', Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Outsource Worker Name"
              value={formState.outsourceWorkerName || ''}
              onChange={e => handleChange('outsourceWorkerName', e.target.value)}
              placeholder="e.g. sahan / malaka"
            />
            <Input
              label="Outsource Worker Fee (LKR)"
              type="number"
              value={formState.outsourceWorkerFee || 0}
              onChange={e => handleChange('outsourceWorkerFee', Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200">
            <Input
              label="My Profit (Rusiru) (LKR)"
              type="number"
              value={formState.myProfit || 0}
              onChange={e => handleChange('myProfit', Number(e.target.value))}
            />
            <Input
              label="Total Invoice Amount (LKR)"
              type="number"
              value={formState.total || 0}
              onChange={e => handleChange('total', Number(e.target.value))}
              helperText="Auto-summed = Broker + Outsource + My Profit"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" leftIcon={<Save className="w-4 h-4" />}>
            Apply Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
