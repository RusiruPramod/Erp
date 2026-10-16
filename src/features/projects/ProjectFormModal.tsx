import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { Project, Customer } from '../../types';
import { formatDateInput } from '../../lib/formatters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  customer_id: z.string().min(1, 'Please select a customer'),
  project_date: z.string().min(1, 'Project date is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  status: z.enum(['active', 'completed', 'cancelled']),
  notes: z.string().optional().nullable(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  projectToEdit,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Fetch customers for the dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: '00000000-0000-0000-0000-000000000005',
            name: 'Shamshard Marikkar (Managing Director)',
            company: 'InterMax (Pvt) Ltd.',
          },
        ];
      }
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, company')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      customer_id: '',
      project_date: formatDateInput(new Date()),
      price: '' as unknown as number,
      status: 'active',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        reset({
          name: projectToEdit.name,
          customer_id: projectToEdit.customer_id,
          project_date: formatDateInput(projectToEdit.project_date),
          price: projectToEdit.price,
          status: projectToEdit.status,
          notes: projectToEdit.notes || '',
        });
      } else {
        reset({
          name: '',
          customer_id: customers[0]?.id || '',
          project_date: formatDateInput(new Date()),
          price: '' as unknown as number,
          status: 'active',
          notes: '',
        });
      }
    }
  }, [isOpen, projectToEdit, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const payload = {
        name: data.name,
        customer_id: data.customer_id,
        project_date: data.project_date,
        price: data.price,
        status: data.status,
        notes: data.notes || null,
        created_by: user?.id || null,
      };

      if (!isSupabaseConfigured) {
        return;
      }

      if (projectToEdit) {
        const { error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', projectToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('projects').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      toast.success(projectToEdit ? 'Project updated' : 'Project created (income recorded)');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save project');
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    saveMutation.mutate(data);
  };

  const handleCustomerCreated = (newCust: Customer) => {
    setValue('customer_id', newCust.id);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={projectToEdit ? 'Edit Project' : 'Create New Project'}
        description="Every project records project price as business income."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Google Workspace File Sync"
            {...register('name')}
            error={errors.name?.message}
          />

          {/* Customer selection with inline Add Customer button */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-700">
                Customer
              </label>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF8C00] hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Customer</span>
              </button>
            </div>
            <Select
              {...register('customer_id')}
              error={errors.customer_id?.message}
            >
              <option value="">Select a customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Project Date"
              type="date"
              {...register('project_date')}
              error={errors.project_date?.message}
            />

            <Input
              label="Project Price / Income (LKR)"
              type="number"
              step="0.01"
              placeholder="0.00"
              helperText="Saved to database as primary project income"
              {...register('price')}
              error={errors.price?.message}
            />
          </div>

          <Select
            label="Status"
            {...register('status')}
            error={errors.status?.message}
          >
            <option value="active">Active (In Progress)</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Textarea
            label="Project Scope / Notes (Optional)"
            placeholder="Deliverables, sync requirements, client instructions..."
            rows={3}
            {...register('notes')}
            error={errors.notes?.message}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting || saveMutation.isPending}>
              {projectToEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Inline Customer Creator Modal */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
};
