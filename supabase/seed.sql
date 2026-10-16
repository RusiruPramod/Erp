-- ============================================================================
-- CodeCrew ERP - Seed SQL
-- Initial Settings, Sample Customer, Sample Project, Document & Instructions
-- ============================================================================

-- 1. SEED SETTINGS (CodeCrew Defaults)
insert into public.settings (
  id,
  business_name,
  owner_name,
  mobile,
  email,
  address,
  logo_primary_color,
  logo_secondary_color,
  bank_account_name,
  bank_account_number,
  bank_name,
  bank_branch,
  default_invoice_notes,
  whatsapp_invoice_template,
  whatsapp_quotation_template,
  invoice_prefix,
  quotation_prefix
) values (
  1,
  'CodeCrew',
  'R.H.V.R.Pramod',
  '0755437148',
  'rusirupramod@gmail.com',
  'Weligama, Sri Lanka',
  '#FF8C00',
  '#111111',
  'R.H.V.R.Pramod',
  '89121867',
  'BOC (Bank of Ceylon)',
  'Weligama',
  'This fee covers only the review, planning, and configuration services listed. Third-party subscriptions, domain charges, and storage upgrades are not included.',
  'Hello {customer}, please find your Invoice {number} for {project}. Total: LKR {total}. View/download: {link}. Thank you, CodeCrew.',
  'Hello {customer}, please find your Quotation {number} for {project}. Total: LKR {total}. View/download: {link}. Thank you, CodeCrew.',
  'INV',
  'QUO'
)
on conflict (id) do update set
  business_name = excluded.business_name,
  owner_name = excluded.owner_name,
  mobile = excluded.mobile,
  email = excluded.email,
  bank_account_name = excluded.bank_account_name,
  bank_account_number = excluded.bank_account_number,
  bank_name = excluded.bank_name,
  bank_branch = excluded.bank_branch,
  default_invoice_notes = excluded.default_invoice_notes;

-- 2. SEED SAMPLE CUSTOMER: Shamshard Marikkar / InterMax (Pvt) Ltd.
do $$
declare
  v_customer_id uuid;
  v_project_id uuid;
  v_invoice_id uuid;
  v_token text := encode(gen_random_bytes(16), 'hex');
begin
  -- Check if sample customer already exists
  select id into v_customer_id from public.customers where phone = '94772078626' limit 1;

  if v_customer_id is null then
    insert into public.customers (id, name, company, phone, email, address)
    values (
      gen_random_uuid(),
      'Shamshard Marikkar (Managing Director)',
      'InterMax (Pvt) Ltd.',
      '94772078626',
      'intermaxsrilanka@gmail.com',
      '435/2, Dutugemunu Rd, Koswatte, Battaramulla, Sri Lanka'
    )
    returning id into v_customer_id;
  end if;

  -- 3. SEED SAMPLE PROJECT: "Google Workspace File Sync"
  select id into v_project_id from public.projects where name = 'Google Workspace File Sync' and customer_id = v_customer_id limit 1;

  if v_project_id is null then
    insert into public.projects (id, name, customer_id, project_date, price, status, notes)
    values (
      gen_random_uuid(),
      'Google Workspace File Sync',
      v_customer_id,
      current_date,
      30000.00,
      'active',
      'Migration & desktop file stream synchronization configuration for InterMax teams.'
    )
    returning id into v_project_id;

    -- Add Sample Ad Expense on Facebook for this project
    insert into public.expenses (project_id, expense_date, type, platform, description, amount)
    values (
      v_project_id,
      current_date,
      'advertisement',
      'Facebook',
      'Targeted Lead Ad Campaign - IT Support Colombo & Battaramulla',
      3500.00
    );

    -- Add Partial Income Payment (e.g. 50% advance: LKR 15,000)
    insert into public.income_payments (project_id, payment_date, amount, note)
    values (
      v_project_id,
      current_date,
      15000.00,
      '50% Advance Bank Transfer'
    );

    -- Seed Year 2026 Counter
    insert into public.counters (doc_type, year, last_number)
    values ('invoice', extract(year from current_date)::integer, 1)
    on conflict (doc_type, year) do update set last_number = counters.last_number + 1;

    -- 4. SEED SAMPLE INVOICE: INV-2026-001
    insert into public.documents (
      id,
      type,
      number,
      project_id,
      customer_id,
      status,
      issue_date,
      due_date,
      discount,
      notes,
      total,
      share_token
    )
    values (
      gen_random_uuid(),
      'invoice',
      'INV-' || extract(year from current_date)::text || '-001',
      v_project_id,
      v_customer_id,
      'partially_paid',
      current_date,
      current_date + interval '14 days',
      0.00,
      'This fee covers only the review, planning, and configuration services listed. Third-party subscriptions, domain charges, and storage upgrades are not included.',
      30000.00,
      v_token
    )
    returning id into v_invoice_id;

    -- 3 Line items (Technical Review 3h, Requirement & Architecture 4h, Configuration Part 5h; total 12 hours, LKR 30,000.00)
    insert into public.document_items (document_id, position, task, description, hours, price, show_included)
    values
      (v_invoice_id, 0, 'Technical Review', 'Audit current storage, bandwidth quotas, DNS TXT/MX records and admin roles.', 3.0, 7500.00, false),
      (v_invoice_id, 1, 'Requirement & Architecture', 'Design department folders, permission tiers, offline access policies and backup schedules.', 4.0, 10000.00, false),
      (v_invoice_id, 2, 'Configuration Part', 'Implement Google Drive client, endpoint drive mapping, and staff migration testing.', 5.0, 12500.00, false);
  end if;
end $$;

-- ============================================================================
-- NOTE ON FIRST ADMIN USER:
-- When you first create an account through Supabase Auth (or the web UI),
-- the schema trigger `handle_new_user()` will AUTOMATICALLY designate the
-- FIRST user registered as 'admin' with active = true!
--
-- If you want to manually elevate an existing user to admin, run:
-- UPDATE public.profiles
-- SET role = 'admin', active = true
-- WHERE email = 'your-email@example.com';
-- ============================================================================
