import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { getStatusBadge } from '../../components/ui/Badge';
import { ProjectFormModal } from './ProjectFormModal';
import { formatLKR, formatDate } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

export const ProjectsListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
  const [deletingProject, setDeletingProject] = useState<any | null>(null);

  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects-list', searchTerm, statusFilter, page],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return {
          projects: [
            {
              id: '00000000-0000-0000-0000-000000000010',
              name: 'Google Workspace File Sync',
              customer_id: '00000000-0000-0000-0000-000000000005',
              customer_name: 'Shamshard Marikkar (Managing Director)',
              customer_company: 'InterMax (Pvt) Ltd.',
              project_date: new Date().toISOString(),
              income: 30000,
              total_expenses: 3500,
              net_profit: 26500,
              margin_pct: 88.33,
              status: 'active',
              total_paid: 15000,
              balance: 15000,
            },
          ],
          count: 1,
        };
      }

      let query = supabase
        .from('project_summary')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: projects, count, error } = await query
        .order('project_date', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { projects: projects || [], count: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.count || 0) / PAGE_SIZE) || 1;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Project deleted');
      setDeletingProject(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete project');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Projects
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Deliverables, ad expenses tracking and net profitability.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
        >
          New Project
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-border shadow-xs">
        <div className="relative flex-1">
          <Input
            placeholder="Search by project or customer name..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 text-xs min-w-[130px]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Projects Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : (data?.projects || []).length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-6 h-6" />}
          title="No projects found"
          description="Create your first client project to track income and ad spend."
          actionLabel="New Project"
          onAction={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Price (Income)</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.projects.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      to={`/projects/${p.id}`}
                      className="font-bold text-neutral-900 hover:text-[#FF8C00] transition-colors"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-neutral-800">
                      {p.customer_name || '-'}
                    </div>
                    {p.customer_company && (
                      <div className="text-[11px] text-neutral-400">
                        {p.customer_company}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-600">
                    {formatDate(p.project_date)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">
                    {formatLKR(p.income)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-neutral-600">
                    {formatLKR(p.total_expenses)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">
                    {formatLKR(p.net_profit)}
                  </TableCell>
                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProjectToEdit(p);
                          setIsModalOpen(true);
                        }}
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingProject(p)}
                          title="Delete Project"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2 text-xs text-neutral-500">
              <p>
                Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(page * PAGE_SIZE, data?.count || 0)} of {data?.count} projects
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 font-semibold text-neutral-800">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={() => deletingProject && deleteMutation.mutate(deletingProject.id)}
        title="Delete Project"
        message={`Are you sure you want to delete ${deletingProject?.name}? This will remove associated timeline records.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
