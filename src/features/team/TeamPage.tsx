import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  UserPlus,
  KeyRound,
  Shield,
  Briefcase,
  CheckCircle,
  XCircle,
  Edit2,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { getStatusBadge } from '../../components/ui/Badge';
import { Profile, Project } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export const TeamPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Add Member Form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [newProjectIds, setNewProjectIds] = useState<string[]>([]);

  // Reset Password Form
  const [resetPassValue, setResetPassValue] = useState('');

  // Assign Projects Form
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);

  // Load Projects for assignment checkboxes
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects-select'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data as Project[]) || [];
    },
  });

  // Load Team Profiles
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [
          {
            id: '00000000-0000-0000-0000-000000000001',
            full_name: 'R.H.V.R. Pramod',
            email: 'rusirupramod@gmail.com',
            role: 'admin' as const,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Call Supabase Edge Function helper
  const invokeEdgeFunction = async (action: string, payload: any) => {
    if (!isSupabaseConfigured) {
      toast.success(`Action '${action}' completed (Demo mode)`);
      return { success: true };
    }

    const { data, error } = await supabase.functions.invoke('create-member', {
      body: { action, ...payload },
      headers: {
        Authorization: `Bearer ${session?.access_token || ''}`,
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // Add Member Mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newName.trim() || !newEmail.trim() || !newPassword) {
        throw new Error('Please fill all required fields');
      }
      return invokeEdgeFunction('create', {
        full_name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
        project_ids: newProjectIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Team member added successfully');
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('member');
      setNewProjectIds([]);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add member');
    },
  });

  // Toggle Active/Inactive Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      return invokeEdgeFunction('update_status', { user_id: userId, active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Member status updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update member status');
    },
  });

  // Reset Password Mutation
  const resetPassMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !resetPassValue || resetPassValue.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      return invokeEdgeFunction('reset_password', {
        user_id: selectedUser.id,
        new_password: resetPassValue,
      });
    },
    onSuccess: () => {
      toast.success('Password reset successfully');
      setIsResetModalOpen(false);
      setResetPassValue('');
      setSelectedUser(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reset password');
    },
  });

  // Assign Projects Mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;
      return invokeEdgeFunction('assign_projects', {
        user_id: selectedUser.id,
        project_ids: assignedProjectIds,
      });
    },
    onSuccess: () => {
      toast.success('Project assignments updated');
      setIsAssignModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to assign projects');
    },
  });

  const openAssignModal = async (member: Profile) => {
    setSelectedUser(member);
    if (!isSupabaseConfigured) {
      setAssignedProjectIds([]);
      setIsAssignModalOpen(true);
      return;
    }
    const { data } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', member.id);
    setAssignedProjectIds((data || []).map(r => r.project_id));
    setIsAssignModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Team Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Administer roles, member access and project assignments.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Member
        </Button>
      </div>

      {/* Members Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map(member => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="font-bold text-neutral-900">{member.full_name}</div>
                  <div className="text-[10px] text-neutral-400">ID: {member.id.slice(0, 8)}...</div>
                </TableCell>
                <TableCell className="text-xs text-neutral-600 font-mono">
                  {member.email}
                </TableCell>
                <TableCell>{getStatusBadge(member.role)}</TableCell>
                <TableCell>
                  {member.active ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400 font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-neutral-400" />
                      Deactivated
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    {/* Assign Projects Button (For Members) */}
                    {member.role === 'member' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignModal(member)}
                        title="Assign Projects"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-neutral-600" />
                      </Button>
                    )}

                    {/* Reset Password Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(member);
                        setIsResetModalOpen(true);
                      }}
                      title="Reset Password"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-neutral-600" />
                    </Button>

                    {/* Activate/Deactivate Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          userId: member.id,
                          active: !member.active,
                        })
                      }
                      title={member.active ? 'Deactivate Member' : 'Activate Member'}
                    >
                      {member.active ? (
                        <span className="text-[11px] font-semibold text-red-600 hover:underline">
                          Deactivate
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 hover:underline">
                          Activate
                        </span>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Team Member"
        description="Creates user via Supabase Auth admin API and initializes profile."
        maxWidth="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            addMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            placeholder="e.g. Ruwan Perera"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="member@codecrew.lk"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            required
          />

          <Input
            label="Temporary Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />

          <Select
            label="Role"
            value={newRole}
            onChange={e => setNewRole(e.target.value as any)}
          >
            <option value="member">Member (Assigned projects only)</option>
            <option value="admin">Administrator (Full Access)</option>
          </Select>

          {/* Project Assignments if Member */}
          {newRole === 'member' && projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Assign Projects (Optional)
              </label>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-border p-2 space-y-1 bg-surface-subtle">
                {projects.map(p => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-xs text-neutral-700 p-1 hover:bg-white rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newProjectIds.includes(p.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setNewProjectIds([...newProjectIds, p.id]);
                        } else {
                          setNewProjectIds(newProjectIds.filter(id => id !== p.id));
                        }
                      }}
                      className="rounded text-[#FF8C00] focus:ring-[#FF8C00]"
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={addMutation.isPending}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Password: ${selectedUser?.full_name}`}
        maxWidth="sm"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            resetPassMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="New Temporary Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={resetPassValue}
            onChange={e => setResetPassValue(e.target.value)}
            required
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResetModalOpen(false)}
              disabled={resetPassMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={resetPassMutation.isPending}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Projects Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Projects: ${selectedUser?.full_name}`}
        description="Select which projects this member can view and add expenses to."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto rounded-lg border border-border p-3 space-y-1 bg-surface-subtle">
            {projects.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No projects available.</p>
            ) : (
              projects.map(p => (
                <label
                  key={p.id}
                  className="flex items-center gap-2.5 text-xs text-neutral-800 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={assignedProjectIds.includes(p.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setAssignedProjectIds([...assignedProjectIds, p.id]);
                      } else {
                        setAssignedProjectIds(assignedProjectIds.filter(id => id !== p.id));
                      }
                    }}
                    className="rounded text-[#FF8C00] focus:ring-[#FF8C00]"
                  />
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-[10px] text-neutral-400">Price: {formatLKR(p.price)}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => assignMutation.mutate()}
              isLoading={assignMutation.isPending}
            >
              Save Assignments
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
