import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { AdCampaign, CampaignStatus } from '../../types';
import { formatLKR, formatDateInput } from '../../lib/formatters';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignToEdit?: AdCampaign | null;
  onSave: (campaignData: {
    name: string;
    fb_campaign_ref?: string | null;
    start_date: string;
    end_date?: string | null;
    status: CampaignStatus;
    ad_spend_usd: number;
    exchange_rate: number;
    ad_spend_lkr: number;
    notes?: string | null;
  }) => Promise<void>;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  campaignToEdit,
  onSave,
}) => {
  const isEditing = Boolean(campaignToEdit);

  const [name, setName] = useState('');
  const [fbRef, setFbRef] = useState('');
  const [startDate, setStartDate] = useState(formatDateInput(new Date()));
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('running');
  const [adSpendUsd, setAdSpendUsd] = useState<number | ''>(0);
  const [exchangeRate, setExchangeRate] = useState<number | ''>(305);
  const [manualLkr, setManualLkr] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (campaignToEdit) {
      setName(campaignToEdit.name || '');
      setFbRef(campaignToEdit.fb_campaign_ref || '');
      setStartDate(formatDateInput(campaignToEdit.start_date));
      setEndDate(campaignToEdit.end_date ? formatDateInput(campaignToEdit.end_date) : '');
      setStatus(campaignToEdit.status || 'running');
      setAdSpendUsd(campaignToEdit.ad_spend_usd ?? 0);
      setExchangeRate(campaignToEdit.exchange_rate ?? 305);
      setManualLkr(campaignToEdit.ad_spend_lkr ?? '');
      setNotes(campaignToEdit.notes || '');
    } else {
      setName('');
      setFbRef('');
      setStartDate(formatDateInput(new Date()));
      setEndDate('');
      setStatus('running');
      setAdSpendUsd(0);
      setExchangeRate(305);
      setManualLkr('');
      setNotes('');
    }
    setErrors({});
  }, [campaignToEdit, isOpen]);

  // Derived LKR calculation
  const calculatedLkr =
    typeof manualLkr === 'number' && manualLkr > 0
      ? manualLkr
      : (Number(adSpendUsd) || 0) * (Number(exchangeRate) || 305);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Campaign name is required';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalUsd = Number(adSpendUsd) || 0;
      const finalRate = Number(exchangeRate) || 305;
      const finalLkr =
        typeof manualLkr === 'number' && manualLkr >= 0
          ? manualLkr
          : Math.round(finalUsd * finalRate * 100) / 100;

      await onSave({
        name: name.trim(),
        fb_campaign_ref: fbRef.trim() || null,
        start_date: startDate,
        end_date: endDate || null,
        status,
        ad_spend_usd: finalUsd,
        exchange_rate: finalRate,
        ad_spend_lkr: finalLkr,
        notes: notes.trim() || null,
      });
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
      title={isEditing ? 'Edit Ad Campaign' : 'Start New Ad Campaign'}
      description="Each Facebook advertising campaign operates as an independent session with its own expenses and orders."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campaign Name */}
        <Input
          label="Campaign Name / Reference *"
          placeholder="e.g. October PCB Design & Smart Medicine Dispenser Campaign"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />

        {/* Facebook Reference & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Facebook Campaign Ref (Optional)"
            placeholder="e.g. FB-ACT-OCT-01 or Campaign ID"
            value={fbRef}
            onChange={e => setFbRef(e.target.value)}
            helperText="Matches your Meta Ads Manager reference"
          />

          <Select
            label="Campaign Status"
            value={status}
            onChange={e => setStatus(e.target.value as CampaignStatus)}
            options={[
              { value: 'running', label: 'Running (Active Inquiries)' },
              { value: 'review', label: 'Closing / Review' },
              { value: 'closed', label: 'Closed (Finalized)' },
            ]}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Start Date *"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            error={errors.startDate}
          />

          <Input
            type="date"
            label="End Date (Optional)"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            helperText="Leave empty while the campaign is running"
          />
        </div>

        {/* Advertising Spend & Currency Box */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Advertising Expenditure & Currency
            </span>
            <span className="text-[11px] text-neutral-500">
              Meta Ads in USD, converted to LKR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="number"
              step="0.01"
              min="0"
              label="Ad Spend (USD $)"
              placeholder="0.00"
              value={adSpendUsd === '' ? '' : adSpendUsd}
              onChange={e => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                setAdSpendUsd(val);
                if (typeof val === 'number') {
                  const rate = Number(exchangeRate) || 305;
                  setManualLkr(Math.round(val * rate * 100) / 100);
                }
              }}
              helperText="Actual Meta ad cost"
            />

            <Input
              type="number"
              step="0.5"
              min="1"
              label="Exchange Rate (USD to LKR)"
              placeholder="305"
              value={exchangeRate === '' ? '' : exchangeRate}
              onChange={e => {
                const rate = e.target.value === '' ? '' : parseFloat(e.target.value);
                setExchangeRate(rate);
                if (typeof rate === 'number' && typeof adSpendUsd === 'number') {
                  setManualLkr(Math.round(adSpendUsd * rate * 100) / 100);
                }
              }}
              helperText="Current bank/card rate"
            />

            <Input
              type="number"
              step="0.01"
              min="0"
              label="Equivalent Spend (LKR)"
              placeholder="0.00"
              value={manualLkr === '' ? '' : manualLkr}
              onChange={e => setManualLkr(e.target.value === '' ? '' : parseFloat(e.target.value))}
              helperText="Calculated or manual override"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60 text-neutral-600">
            <span>Summary:</span>
            <span className="font-semibold text-neutral-900">
              ${Number(adSpendUsd || 0).toFixed(2)} USD ≈ {formatLKR(calculatedLkr)}
            </span>
          </div>
        </div>

        {/* Notes */}
        <Textarea
          label="Campaign Notes & Strategy"
          placeholder="Target audience, product focus, objectives..."
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Start Campaign'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

