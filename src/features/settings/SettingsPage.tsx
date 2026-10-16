import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  Building2,
  Landmark,
  FileText,
  MessageCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { Settings } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

const settingsSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  owner_name: z.string().min(1, 'Owner name is required'),
  mobile: z.string().min(1, 'Mobile number is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().min(1, 'Address is required'),
  logo_primary_color: z.string().min(4, 'Primary color is required'),
  logo_secondary_color: z.string().min(4, 'Secondary color is required'),
  bank_account_name: z.string().min(1, 'Account name is required'),
  bank_account_number: z.string().min(1, 'Account number is required'),
  bank_name: z.string().min(1, 'Bank name is required'),
  bank_branch: z.string().min(1, 'Bank branch is required'),
  default_invoice_notes: z.string().min(1, 'Default note is required'),
  whatsapp_invoice_template: z.string().min(1, 'Template is required'),
  whatsapp_quotation_template: z.string().min(1, 'Template is required'),
  invoice_prefix: z.string().min(1, 'Prefix is required'),
  quotation_prefix: z.string().min(1, 'Prefix is required'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const DEFAULT_SETTINGS: SettingsFormData = {
  business_name: 'CodeCrew',
  owner_name: 'R.H.V.R.Pramod',
  mobile: '0755437148',
  email: 'rusirupramod@gmail.com',
  address: 'Weligama, Sri Lanka',
  logo_primary_color: '#FF8C00',
  logo_secondary_color: '#111111',
  bank_account_name: 'R.H.V.R.Pramod',
  bank_account_number: '89121867',
  bank_name: 'BOC (Bank of Ceylon)',
  bank_branch: 'Weligama',
  default_invoice_notes:
    'This fee covers only the review, planning, and configuration services listed. Third-party subscriptions, domain charges, and storage upgrades are not included.',
  whatsapp_invoice_template:
    'Hello {customer}, please find your Invoice {number} for {project}. Total: {total}. View/download: {link}\n\nThank you,\nCodeCrew',
  whatsapp_quotation_template:
    'Hello {customer}, please find your Quotation {number} for {project}. Total: {total}. View/download: {link}\n\nThank you,\nCodeCrew',
  invoice_prefix: 'INV',
  quotation_prefix: 'QUO',
};

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_SETTINGS,
  });

  const { data: serverSettings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return { id: 1, ...DEFAULT_SETTINGS, updated_at: '' } as Settings;
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (serverSettings) {
      reset({
        business_name: serverSettings.business_name || DEFAULT_SETTINGS.business_name,
        owner_name: serverSettings.owner_name || DEFAULT_SETTINGS.owner_name,
        mobile: serverSettings.mobile || DEFAULT_SETTINGS.mobile,
        email: serverSettings.email || DEFAULT_SETTINGS.email,
        address: serverSettings.address || DEFAULT_SETTINGS.address,
        logo_primary_color: serverSettings.logo_primary_color || DEFAULT_SETTINGS.logo_primary_color,
        logo_secondary_color: serverSettings.logo_secondary_color || DEFAULT_SETTINGS.logo_secondary_color,
        bank_account_name: serverSettings.bank_account_name || DEFAULT_SETTINGS.bank_account_name,
        bank_account_number: serverSettings.bank_account_number || DEFAULT_SETTINGS.bank_account_number,
        bank_name: serverSettings.bank_name || DEFAULT_SETTINGS.bank_name,
        bank_branch: serverSettings.bank_branch || DEFAULT_SETTINGS.bank_branch,
        default_invoice_notes: serverSettings.default_invoice_notes || DEFAULT_SETTINGS.default_invoice_notes,
        whatsapp_invoice_template: serverSettings.whatsapp_invoice_template || DEFAULT_SETTINGS.whatsapp_invoice_template,
        whatsapp_quotation_template: serverSettings.whatsapp_quotation_template || DEFAULT_SETTINGS.whatsapp_quotation_template,
        invoice_prefix: serverSettings.invoice_prefix || DEFAULT_SETTINGS.invoice_prefix,
        quotation_prefix: serverSettings.quotation_prefix || DEFAULT_SETTINGS.quotation_prefix,
      });
    }
  }, [serverSettings, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      if (!isSupabaseConfigured) {
        toast.success('Settings saved (Demo mode)');
        return;
      }

      const { error } = await supabase
        .from('settings')
        .upsert({ id: 1, ...data });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update settings');
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Settings & Defaults
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure business identity, bank beneficiary details, and WhatsApp messaging templates.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSubmit(onSubmit)}
          isLoading={isSubmitting || saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. Business Profile */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building2 className="w-4 h-4 text-[#FF8C00]" />
            <h2 className="text-sm font-bold text-neutral-900">
              Business Profile (Printed on Invoices & Quotations)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business / Brand Name"
              {...register('business_name')}
              error={errors.business_name?.message}
            />

            <Input
              label="Owner / Representative Name"
              {...register('owner_name')}
              error={errors.owner_name?.message}
            />

            <Input
              label="Mobile Number"
              {...register('mobile')}
              error={errors.mobile?.message}
            />

            <Input
              label="Official Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <div className="sm:col-span-2">
              <Input
                label="Physical Address"
                {...register('address')}
                error={errors.address?.message}
              />
            </div>

            <div>
              <Input
                label="Logo Primary Color (Brand Orange)"
                {...register('logo_primary_color')}
                error={errors.logo_primary_color?.message}
              />
            </div>

            <div>
              <Input
                label="Logo Secondary Color (Black/Neutral)"
                {...register('logo_secondary_color')}
                error={errors.logo_secondary_color?.message}
              />
            </div>
          </div>
        </Card>

        {/* 2. Bank Details */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Landmark className="w-4 h-4 text-[#FF8C00]" />
            <h2 className="text-sm font-bold text-neutral-900">
              Bank / Beneficiary Payment Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Account Name"
              {...register('bank_account_name')}
              error={errors.bank_account_name?.message}
            />

            <Input
              label="Account Number"
              {...register('bank_account_number')}
              error={errors.bank_account_number?.message}
            />

            <Input
              label="Bank Name"
              {...register('bank_name')}
              error={errors.bank_name?.message}
            />

            <Input
              label="Branch"
              {...register('bank_branch')}
              error={errors.bank_branch?.message}
            />
          </div>
        </Card>

        {/* 3. Document Numbering & Notes */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileText className="w-4 h-4 text-[#FF8C00]" />
            <h2 className="text-sm font-bold text-neutral-900">
              Document Numbering & Default Terms
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Invoice Number Prefix"
              placeholder="INV"
              helperText="E.g. INV produces INV-2026-001"
              {...register('invoice_prefix')}
              error={errors.invoice_prefix?.message}
            />

            <Input
              label="Quotation Number Prefix"
              placeholder="QUO"
              helperText="E.g. QUO produces QUO-2026-001"
              {...register('quotation_prefix')}
              error={errors.quotation_prefix?.message}
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Default Invoice Notes & Exclusions"
                rows={3}
                helperText="Pre-filled on every newly created quotation and invoice"
                {...register('default_invoice_notes')}
                error={errors.default_invoice_notes?.message}
              />
            </div>
          </div>
        </Card>

        {/* 4. WhatsApp Message Templates */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-neutral-900">
              WhatsApp Click-to-Chat Templates
            </h2>
          </div>

          <p className="text-xs text-neutral-500">
            Available variables:{' '}
            <code className="text-[#FF8C00] font-bold">&#123;customer&#125;</code>,{' '}
            <code className="text-[#FF8C00] font-bold">&#123;number&#125;</code>,{' '}
            <code className="text-[#FF8C00] font-bold">&#123;project&#125;</code>,{' '}
            <code className="text-[#FF8C00] font-bold">&#123;total&#125;</code>,{' '}
            <code className="text-[#FF8C00] font-bold">&#123;link&#125;</code>
          </p>

          <div className="space-y-4">
            <Textarea
              label="Invoice WhatsApp Message Template"
              rows={3}
              {...register('whatsapp_invoice_template')}
              error={errors.whatsapp_invoice_template?.message}
            />

            <Textarea
              label="Quotation WhatsApp Message Template"
              rows={3}
              {...register('whatsapp_quotation_template')}
              error={errors.whatsapp_quotation_template?.message}
            />
          </div>
        </Card>

        {/* Bottom Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={isSubmitting || saveMutation.isPending}
          >
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
