import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatDateInput } from '../../lib/formatters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

const paymentSchema = z.object({
  payment_date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  note: z.string().optional().nullable(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: formatDateInput(new Date()),
      amount: '' as unknown as number,
      note: '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const payload = {
        project_id: projectId,
        payment_date: data.payment_date,
        amount: data.amount,
        note: data.note || null,
        created_by: user?.id || null,
      };

      if (!isSupabaseConfigured) {
        return;
      }

      const { error } = await supabase.from('income_payments').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['income_payments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project_summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      toast.success('Income payment recorded successfully');
      reset();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record payment');
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Client Payment"
      description={`Add an income installment received for ${projectName}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(data => saveMutation.mutate(data))} className="space-y-4">
        <Input
          label="Payment Date"
          type="date"
          {...register('payment_date')}
          error={errors.payment_date?.message}
        />

        <Input
          label="Amount Received (LKR)"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register('amount')}
          error={errors.amount?.message}
        />

        <Input
          label="Payment Note / Reference (Optional)"
          placeholder="e.g. 50% Advance Transfer / Cheque #8812"
          {...register('note')}
          error={errors.note?.message}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting || saveMutation.isPending}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
