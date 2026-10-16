import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Loader2 } from 'lucide-react';
import { formatDateInput } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

interface QuickAddExpenseRowProps {
  defaultProjectId?: string | null;
}

export const QuickAddExpenseRow: React.FC<QuickAddExpenseRowProps> = ({ defaultProjectId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(formatDateInput(new Date()));
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [type, setType] = useState<'advertisement' | 'other'>('advertisement');
  const [platform, setPlatform] = useState('Facebook');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Fetch projects list for dropdown if not scoped to a single project
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-select'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('project_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !defaultProjectId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!description.trim()) throw new Error('Please enter a description');
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error('Please enter a valid amount');

      const payload = {
        project_id: (defaultProjectId || projectId) || null,
        expense_date: date,
        type,
        platform: type === 'advertisement' ? platform : null,
        category: type === 'other' ? category : null,
        description: description.trim(),
        amount: numAmount,
        created_by: user?.id || null,
      };

      if (!isSupabaseConfigured) {
        return;
      }

      const { error } = await supabase.from('expenses').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      toast.success('Expense recorded');
      setDescription('');
      setAmount('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add expense');
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMutation.mutate();
    }
  };

  return (
    <div className="bg-[#FFF4E6]/40 border border-[#FFD9B3] rounded-xl p-3 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-[#CC7000] uppercase tracking-wider flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />
          Quick Add Expense (Press Enter to Save)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
        {/* Date */}
        <div className="sm:col-span-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
          />
        </div>

        {/* Project Selector if not fixed */}
        {!defaultProjectId && (
          <div className="sm:col-span-2">
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
            >
              <option value="">General Overhead</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Type / Platform */}
        <div className={defaultProjectId ? 'sm:col-span-2' : 'sm:col-span-2'}>
          <select
            value={type === 'advertisement' ? platform : 'other'}
            onChange={e => {
              const val = e.target.value;
              if (val === 'other') {
                setType('other');
              } else {
                setType('advertisement');
                setPlatform(val);
              }
            }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
          >
            <optgroup label="Advertisement Platform">
              <option value="Facebook">Facebook / Meta</option>
              <option value="Instagram">Instagram</option>
              <option value="Google">Google Ads</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Other">Other Ad Platform</option>
            </optgroup>
            <optgroup label="Other">
              <option value="other">General Expense</option>
            </optgroup>
          </select>
        </div>

        {/* Description */}
        <div className={defaultProjectId ? 'sm:col-span-5' : 'sm:col-span-3'}>
          <input
            type="text"
            placeholder="Campaign / expense description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
          />
        </div>

        {/* Amount */}
        <div className="sm:col-span-2">
          <input
            type="number"
            step="0.01"
            placeholder="LKR 0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
          />
        </div>

        {/* Save button */}
        <div className="sm:col-span-1 flex items-center">
          <button
            type="button"
            disabled={addMutation.isPending}
            onClick={() => addMutation.mutate()}
            className="w-full flex items-center justify-center rounded-md bg-[#FF8C00] py-1.5 text-white hover:bg-[#E07B00] transition-colors font-bold text-xs shadow-xs disabled:opacity-50"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
