import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Customer } from '../../types';
import { normalizePhone } from '../../lib/phone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

const customerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  company: z.string().optional().nullable(),
  phone: z.string().min(9, 'Valid phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional().nullable(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onCustomerCreated?: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onCustomerCreated,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        reset({
          name: customerToEdit.name,
          company: customerToEdit.company || '',
          phone: customerToEdit.phone,
          email: customerToEdit.email || '',
          address: customerToEdit.address || '',
        });
      } else {
        reset({
          name: '',
          company: '',
          phone: '',
          email: '',
          address: '',
        });
      }
    }
  }, [isOpen, customerToEdit, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const normalizedPhone = normalizePhone(data.phone);
      const payload = {
        name: data.name,
        company: data.company || null,
        phone: normalizedPhone,
        email: data.email && data.email !== '' ? data.email : null,
        address: data.address || null,
        created_by: user?.id || null,
      };

      if (!isSupabaseConfigured) {
        const fakeCustomer: Customer = {
          id: customerToEdit?.id || `cust-${Date.now()}`,
          name: payload.name,
          company: payload.company,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          created_by: payload.created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return fakeCustomer;
      }

      if (customerToEdit) {
        const { data: updated, error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', customerToEdit.id)
          .select()
          .single();
        if (error) throw error;
        return updated as Customer;
      } else {
        const { data: created, error } = await supabase
          .from('customers')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return created as Customer;
      }
    },
    onSuccess: (savedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-select'] });
      toast.success(customerToEdit ? 'Customer updated' : 'Customer created successfully');
      if (onCustomerCreated && savedCustomer) {
        onCustomerCreated(savedCustomer);
      }
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save customer');
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'Edit Customer' : 'Add New Customer'}
      description="Store client contact details and WhatsApp phone numbers."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name or Representative"
          placeholder="e.g. Shamshard Marikkar (Managing Director)"
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          label="Company / Business Name (Optional)"
          placeholder="e.g. InterMax (Pvt) Ltd."
          {...register('company')}
          error={errors.company?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone (WhatsApp Number)"
            placeholder="0772078626 or +94 77..."
            helperText="Auto-normalized to 94XXXXXXXXX for WhatsApp"
            {...register('phone')}
            error={errors.phone?.message}
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="client@example.com"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>

        <Textarea
          label="Office Address (Optional)"
          placeholder="435/2, Dutugemunu Rd, Koswatte..."
          rows={2}
          {...register('address')}
          error={errors.address?.message}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting || saveMutation.isPending}>
            {customerToEdit ? 'Update Customer' : 'Save Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
