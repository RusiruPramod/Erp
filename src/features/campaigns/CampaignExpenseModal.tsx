import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { AdCampaignExpense, AdExpenseCategory } from '../../types';
import { formatLKR, formatDateInput } from '../../lib/formatters';

interface CampaignExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  expenseToEdit?: AdCampaignExpense | null;
  onSave: (expenseData: {
    campaign_id: string;
    category: AdExpenseCategory;
    description: string;
    expense_date: string;
    amount: number;
    currency: 'LKR' | 'USD';
    exchange_rate: number;
    amount_lkr: number;
    notes?: string | null;
  }) => Promise<void>;
}

export const CampaignExpenseModal: React.FC<CampaignExpenseModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  expenseToEdit,
  onSave,
}) => {
  const isEditing = Boolean(expenseToEdit);

  const [category, setCategory] = useState<AdExpenseCategory>('Packaging');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(formatDateInput(new Date()));
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'LKR' | 'USD'>('LKR');
  const [exchangeRate, setExchangeRate] = useState<number | ''>(305);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (expenseToEdit) {
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setExpenseDate(formatDateInput(expenseToEdit.expense_date));
      setAmount(expenseToEdit.amount);
      setCurrency(expenseToEdit.currency);
      setExchangeRate(expenseToEdit.exchange_rate || 305);
      setNotes(expenseToEdit.notes || '');
    } else {
      setCategory('Packaging');
      setDescription('');
      setExpenseDate(formatDateInput(new Date()));
      setAmount('');
      setCurrency('LKR');
      setExchangeRate(305);
      setNotes('');
    }
    setErrors({});
  }, [expenseToEdit, isOpen]);

  const numAmount = Number(amount) || 0;
  const numRate = Number(exchangeRate) || 305;
  const calculatedLkr = currency === 'USD' ? Math.round(numAmount * numRate * 100) / 100 : numAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (amount === '' || Number(amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        campaign_id: campaignId,
        category,
        description: description.trim(),
        expense_date: expenseDate,
        amount: numAmount,
        currency,
        exchange_rate: numRate,
        amount_lkr: calculatedLkr,
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
      title={isEditing ? 'Edit Campaign Expense' : 'Add Campaign Operational Expense'}
      description="Record operational costs like packaging, delivery courier fees, or extra material purchases."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Expense Category"
            value={category}
            onChange={e => setCategory(e.target.value as AdExpenseCategory)}
            options={[
              { value: 'Packaging', label: 'Packaging (Boxes, bubble wrap, labels)' },
              { value: 'Delivery', label: 'Delivery & Courier Fees' },
              { value: 'Material purchases', label: 'Material Purchases' },
              { value: 'Operational', label: 'Operational Expenses' },
              { value: 'Other', label: 'Other' },
            ]}
          />

          <Input
            type="date"
            label="Expense Date"
            value={expenseDate}
            onChange={e => setExpenseDate(e.target.value)}
          />
        </div>

        {/* Description */}
        <Input
          label="Description *"
          placeholder="e.g. Courier delivery fee for Smart Dispenser PCB batch"
          value={description}
          onChange={e => setDescription(e.target.value)}
          error={errors.description}
          autoFocus
        />

        {/* Amount & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            type="number"
            step="0.01"
            min="0"
            label={`Amount (${currency}) *`}
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
            error={errors.amount}
          />

          <Select
            label="Currency"
            value={currency}
            onChange={e => setCurrency(e.target.value as 'LKR' | 'USD')}
            options={[
              { value: 'LKR', label: 'LKR (Sri Lankan Rupee)' },
              { value: 'USD', label: 'USD (US Dollar)' },
            ]}
          />

          {currency === 'USD' ? (
            <Input
              type="number"
              step="1"
              min="1"
              label="USD/LKR Rate"
              value={exchangeRate}
              onChange={e => setExchangeRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
          ) : (
            <div className="flex flex-col justify-end pb-2">
              <span className="text-[11px] text-neutral-400">Recorded directly in LKR</span>
            </div>
          )}
        </div>

        {currency === 'USD' && (
          <div className="text-xs text-neutral-600 bg-neutral-50 rounded-lg p-2.5 flex justify-between items-center">
            <span>Converted LKR Amount:</span>
            <span className="font-bold text-neutral-900">{formatLKR(calculatedLkr)}</span>
          </div>
        )}

        {/* Notes */}
        <Textarea
          label="Notes (Optional)"
          placeholder="Receipt reference, vendor notes, etc."
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Expense' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

