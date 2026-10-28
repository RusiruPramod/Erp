import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Mail,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CustomerFormModal } from './CustomerFormModal';
import { Customer } from '../../types';
import { formatPhoneDisplay } from '../../lib/phone';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export const CustomersListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }
      let query = supabase.from('customers').select('*').order('name', { ascending: true });
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
      setDeletingCustomer(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cannot delete customer linked to projects');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage clients, contact profiles and direct WhatsApp chat links.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
        >
          Add Customer
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-border shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by name, company, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Customer Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No customers found"
          description="Add your first client to start creating projects and invoices."
          actionLabel="Add Customer"
          onAction={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer / Company</TableHead>
              <TableHead>WhatsApp Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-bold text-neutral-900">{c.name}</div>
                  {c.company && (
                    <div className="text-xs text-neutral-500 font-medium">{c.company}</div>
                  )}
                </TableCell>
                <TableCell>
                  <a
                    href={`https://wa.me/${c.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatPhoneDisplay(c.phone)}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </TableCell>
                <TableCell className="text-xs text-neutral-600">
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:underline">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      {c.email}
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-xs text-neutral-600 max-w-xs truncate">
                  {c.address || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCustomer(c);
                        setIsModalOpen(true);
                      }}
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingCustomer(c)}
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        customerToEdit={editingCustomer}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={() => deletingCustomer && deleteMutation.mutate(deletingCustomer.id)}
        title="Delete Customer"
        message={`Are you sure you want to delete ${deletingCustomer?.name}? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
