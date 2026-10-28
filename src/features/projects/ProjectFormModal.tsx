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
import { UserPlus, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  customer_id: z.string().min(1, 'Please select a customer'),
  project_date: z.string().min(1, 'Project date is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  outsourcer_name: z.string().optional().nullable(),
  outsourcer_cost: z.coerce.number().min(0).optional().default(0),
  broker_name: z.string().optional().nullable(),
  broker_commission: z.coerce.number().min(0).optional().default(0),
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

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
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
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      customer_id: '',
      project_date: formatDateInput(new Date()),
      price: '' as unknown as number,
      outsourcer_name: '',
      outsourcer_cost: 0,
      broker_name: '',
      broker_commission: 0,
      status: 'active',
      notes: '',
    },
  });

  const watchedPrice = watch('price') || 0;
  const watchedOutsourcerCost = watch('outsourcer_cost') || 0;
  const watchedBrokerCommission = watch('broker_commission') || 0;
  const myProfit = Number(watchedPrice) - Number(watchedOutsourcerCost) - Number(watchedBrokerCommission);

  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        reset({
          name: projectToEdit.name,
          customer_id: projectToEdit.customer_id,
          project_date: formatDateInput(projectToEdit.project_date),
          price: projectToEdit.price,
          outsourcer_name: (projectToEdit as any).outsourcer_name || '',
          outsourcer_cost: (projectToEdit as any).outsourcer_cost || 0,
          broker_name: (projectToEdit as any).broker_name || '',
          broker_commission: (projectToEdit as any).broker_commission || 0,
          status: projectToEdit.status,
          notes: projectToEdit.notes || '',
        });
      } else {
        reset({
          name: '',
          customer_id: customers[0]?.id || '',
          project_date: formatDateInput(new Date()),
          price: '' as unknown as number,
          outsourcer_name: '',
          outsourcer_cost: 0,
          broker_name: '',
          broker_commission: 0,
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
        outsourcer_name: data.outsourcer_name || null,
        outsourcer_cost: data.outsourcer_cost || 0,
        broker_name: data.broker_name || null,
        broker_commission: data.broker_commission || 0,
        status: data.status,
        notes: data.notes || null,
        created_by: user?.id || null,
      };

      if (!isSupabaseConfigured) return;

      if (projectToEdit) {
        const { error } = await supabase.from('projects').update(payload).eq('id', projectToEdit.id);
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
      toast.success(projectToEdit ? 'Project updated!' : 'Project created!');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save project');
    },
  });

  const handleCustomerCreated = (newCust: Customer) => {
    setValue('customer_id', newCust.id);
  };

  const isLoss = myProfit < 0 && (Number(watchedOutsourcerCost) > 0 || Number(watchedBrokerCommission) > 0);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={projectToEdit ? 'Edit Project' : 'New Project'}
        description="Enter the project details and pricing below."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5">

          {/* Project Name */}
          <Input
            label="Project Name"
            placeholder="e.g. Company Website Design"
            {...register('name')}
            error={errors.name?.message}
          />

          {/* Customer */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-700">Customer</label>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF8C00] hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Customer</span>
              </button>
            </div>
            <Select {...register('customer_id')} error={errors.customer_id?.message}>
              <option value="">Select a customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* Date + Status */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Project Date"
              type="date"
              {...register('project_date')}
              error={errors.project_date?.message}
            />
            <Select label="Status" {...register('status')} error={errors.status?.message}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>

          {/* ── PRICING SECTION ── */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-4">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pricing</p>

            {/* Client Price */}
            <Input
              label="Client Price (LKR) — shown on Invoice"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('price')}
              error={errors.price?.message}
            />

            {/* Outsourcer */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Outsourcer Name (optional)"
                placeholder="e.g. Kasun Silva"
                {...register('outsourcer_name')}
              />
              <Input
                label="Outsourcer Cost (LKR)"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('outsourcer_cost')}
              />
            </div>

            {/* Broker */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Broker Name (optional)"
                placeholder="e.g. Nimal Perera"
                {...register('broker_name')}
              />
              <Input
                label="Broker Commission (LKR)"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('broker_commission')}
              />
            </div>

            {/* Live Profit Preview */}
            {Number(watchedPrice) > 0 && (
              <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${isLoss ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center gap-2">
                  {isLoss
                    ? <AlertCircle className="w-4 h-4 text-red-500" />
                    : <TrendingUp className="w-4 h-4 text-green-600" />
                  }
                  <span className="text-xs font-semibold text-neutral-600">My Profit</span>
                </div>
                <span className={`text-sm font-bold ${isLoss ? 'text-red-600' : 'text-green-700'}`}>
                  LKR {myProfit.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <Textarea
            label="Notes (Optional)"
            placeholder="Project scope, deliverables, client instructions..."
            rows={2}
            {...register('notes')}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting || saveMutation.isPending}>
              {projectToEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
};
