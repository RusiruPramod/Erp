import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Users,
  TrendingUp,
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
              name: 'Company Website Redesign',
              customer_id: '00000000-0000-0000-0000-000000000005',
              customer_name: 'Shamshard Marikkar',
              customer_company: 'InterMax (Pvt) Ltd.',
              project_date: new Date().toISOString(),
              income: 85000,
              outsourcer_name: 'Kasun Silva',
              outsourcer_cost: 40000,
              broker_name: null,
              broker_commission: 0,
              my_profit: 45000,
              margin_pct: 52.94,
              status: 'active',
              total_paid: 50000,
              balance: 35000,
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

  const projects = data?.projects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Projects
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Track your projects, costs, and profit — simple and clear.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => { setProjectToEdit(null); setIsModalOpen(true); }}
        >
          New Project
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-border shadow-xs">
        <div className="relative flex-1">
          <Input
            placeholder="Search by project or customer..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-9 text-xs"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 text-xs min-w-[130px]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-6 h-6" />}
          title="No projects yet"
          description="Add your first project to start tracking income and profit."
          actionLabel="New Project"
          onAction={() => { setProjectToEdit(null); setIsModalOpen(true); }}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Client Price</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">My Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(p => {
                const profit = Number(p.my_profit ?? 0);
                const isLoss = profit < 0;
                const hasOutsourcer = p.outsourcer_name;
                const hasBroker = p.broker_name;
                const totalCosts = Number(p.outsourcer_cost ?? 0) + Number(p.broker_commission ?? 0);

                return (
                  <TableRow key={p.id}>
                    {/* Project Name */}
                    <TableCell>
                      <Link
                        to={`/projects/${p.id}`}
                        className="font-bold text-neutral-900 hover:text-[#FF8C00] transition-colors"
                      >
                        {p.name}
                      </Link>
                      {/* Outsourcer / Broker badges */}
                      {(hasOutsourcer || hasBroker) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {hasOutsourcer && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                              <Users className="w-2.5 h-2.5" />
                              {p.outsourcer_name}
                            </span>
                          )}
                          {hasBroker && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-100">
                              <TrendingUp className="w-2.5 h-2.5" />
                              {p.broker_name}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="text-xs font-medium text-neutral-800">{p.customer_name || '-'}</div>
                      {p.customer_company && (
                        <div className="text-[11px] text-neutral-400">{p.customer_company}</div>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-neutral-600">
                      {formatDate(p.project_date)}
                    </TableCell>

                    {/* Client Price */}
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {formatLKR(p.income)}
                    </TableCell>

                    {/* Costs (outsourcer + broker) */}
                    <TableCell className="text-right text-xs">
                      {totalCosts > 0 ? (
                        <div className="space-y-0.5">
                          {Number(p.outsourcer_cost) > 0 && (
                            <div className="text-blue-600 font-mono">{formatLKR(p.outsourcer_cost)}</div>
                          )}
                          {Number(p.broker_commission) > 0 && (
                            <div className="text-purple-600 font-mono">{formatLKR(p.broker_commission)}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </TableCell>

                    {/* My Profit */}
                    <TableCell className="text-right">
                      <span className={`font-mono text-xs font-bold ${isLoss ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatLKR(profit)}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(p.status)}</TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setProjectToEdit(p); setIsModalOpen(true); }}
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
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2 text-xs text-neutral-500">
              <p>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data?.count || 0)} of {data?.count}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 font-semibold text-neutral-800">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setProjectToEdit(null); }}
        projectToEdit={projectToEdit}
      />
      <ConfirmDialog
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={() => deletingProject && deleteMutation.mutate(deletingProject.id)}
        title="Delete Project"
        message={`Delete "${deletingProject?.name}"? This cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
