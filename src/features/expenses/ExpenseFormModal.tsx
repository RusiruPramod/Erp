import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Expense } from '../../types';
import { formatDateInput } from '../../lib/formatters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

const expenseSchema = z.object({
  project_id: z.string().optional().nullable(),
  expense_date: z.string().min(1, 'Date is required'),
  type: z.enum(['advertisement', 'other']),
  platform: z.enum(['Facebook', 'Instagram', 'Google', 'TikTok', 'YouTube', 'Other']).optional().nullable(),
  category: z.string().optional().nullable(),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
  defaultProjectId?: string | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
  defaultProjectId,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load user's accessible projects for the dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-select'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          { id: '00000000-0000-0000-0000-000000000010', name: 'Google Workspace File Sync' },
        ];
      }
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('project_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      project_id: defaultProjectId || null,
      expense_date: formatDateInput(new Date()),
      type: 'advertisement',
      platform: 'Facebook',
      category: '',
      description: '',
      amount: '' as unknown as number,
    },
  });

  const expenseType = watch('type');

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        reset({
          project_id: expenseToEdit.project_id || null,
          expense_date: formatDateInput(expenseToEdit.expense_date),
          type: expenseToEdit.type,
          platform: expenseToEdit.platform || 'Facebook',
          category: expenseToEdit.category || '',
          description: expenseToEdit.description,
          amount: expenseToEdit.amount,
        });
      } else {
        reset({
          project_id: defaultProjectId || null,
          expense_date: formatDateInput(new Date()),
          type: 'advertisement',
          platform: 'Facebook',
          category: '',
          description: '',
          amount: '' as unknown as number,
        });
      }
    }
  }, [isOpen, expenseToEdit, defaultProjectId, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const payload = {
        project_id: data.project_id && data.project_id !== '' ? data.project_id : null,
        expense_date: data.expense_date,
        type: data.type,
        platform: data.type === 'advertisement' ? data.platform : null,
        category: data.type === 'other' ? data.category : null,
        description: data.description,
        amount: data.amount,
        created_by: user?.id || null,
      };

      if (!isSupabaseConfigured) {
        toast.success(expenseToEdit ? 'Expense updated' : 'Expense recorded');
        return;
      }

      if (expenseToEdit) {
        const { error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', expenseToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('expenses').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      toast.success(expenseToEdit ? 'Expense updated successfully' : 'Expense recorded successfully');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save expense');
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Expense' : 'Record New Expense'}
      description="Track advertisement costs or general operating expenses."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Project Selection */}
        <Select
          label="Project (Optional for general overhead)"
          {...register('project_id')}
          error={errors.project_id?.message}
        >
          <option value="">General Overhead (No Project)</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Date */}
          <Input
            label="Expense Date"
            type="date"
            {...register('expense_date')}
            error={errors.expense_date?.message}
          />

          {/* Type */}
          <Select
            label="Expense Type"
            {...register('type')}
            error={errors.type?.message}
          >
            <option value="advertisement">Advertisement (Ad spend)</option>
            <option value="other">Other Business Expense</option>
          </Select>
        </div>

        {/* Ad Platform or Category */}
        {expenseType === 'advertisement' ? (
          <Select
            label="Ad Platform"
            {...register('platform')}
            error={errors.platform?.message}
          >
            <option value="Facebook">Facebook / Meta</option>
            <option value="Instagram">Instagram</option>
            <option value="Google">Google Ads</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="Other">Other Platform</option>
          </Select>
        ) : (
          <Input
            label="Category"
            placeholder="e.g. Hosting, Software, Office, Freelancer"
            {...register('category')}
            error={errors.category?.message}
          />
        )}

        {/* Description */}
        <Input
          label="Description / Campaign Name"
          placeholder="e.g. Lead Generation Campaign Week 1"
          {...register('description')}
          error={errors.description?.message}
        />

        {/* Amount */}
        <Input
          label="Amount (LKR)"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register('amount')}
          error={errors.amount?.message}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting || saveMutation.isPending}>
            {expenseToEdit ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
