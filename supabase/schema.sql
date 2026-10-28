-- ============================================================================
-- CodeCrew ERP - Complete Supabase Database Schema
-- Production Ready with RLS, Security Definer Functions, Views & RPCs
-- ============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. TABLES

-- PROFILES (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CUSTOMERS
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text not null, -- Normalized e.g. 94772078626
  email text,
  address text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  project_date date not null default current_date,
  price numeric(14, 2) not null default 0.00 check (price >= 0),            -- Client price = invoice total
  outsourcer_name text,                                                       -- Who did the work (optional)
  outsourcer_cost numeric(14, 2) not null default 0.00 check (outsourcer_cost >= 0), -- What we pay outsourcer
  broker_name text,                                                            -- Broker who brought client (optional)
  broker_commission numeric(14, 2) not null default 0.00 check (broker_commission >= 0), -- What we pay broker
  -- my_profit = price - outsourcer_cost - broker_commission (calculated in SQL view)
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PROJECT MEMBERS (Role-based assignment)
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

-- INCOME PAYMENTS (Partial payment tracking against project price)
create table if not exists public.income_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(14, 2) not null check (amount > 0),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EXPENSES (Outcome - Ads & Non-ad expenses)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null, -- Nullable for general business overhead
  expense_date date not null default current_date,
  type text not null default 'advertisement' check (type in ('advertisement', 'other')),
  platform text check (platform in ('Facebook', 'Instagram', 'Google', 'TikTok', 'YouTube', 'Other') or platform is null),
  category text, -- E.g. Software, Hosting, Freelancer, Office
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DOCUMENTS (Quotations & Invoices)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('quotation', 'invoice')),
  number text not null unique,
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null check (status in ('draft', 'sent', 'accepted', 'rejected', 'partially_paid', 'paid', 'overdue')),
  issue_date date not null default current_date,
  due_date date,
  discount numeric(14, 2) not null default 0.00 check (discount >= 0),
  notes text,
  total numeric(14, 2) not null default 0.00 check (total >= 0),
  share_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  pdf_path text,
  sent_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DOCUMENT ITEMS (Line items)
create table if not exists public.document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  position integer not null default 0,
  task text not null,
  description text,
  hours numeric(8, 2),
  price numeric(14, 2) not null default 0.00 check (price >= 0),
  show_included boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SETTINGS (Single row with business profile, bank details, & defaults)
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null default 'CodeCrew',
  owner_name text not null default 'R.H.V.R.Pramod',
  mobile text not null default '0755437148',
  email text not null default 'rusirupramod@gmail.com',
  address text not null default 'Sri Lanka',
  logo_primary_color text not null default '#FF8C00',
  logo_secondary_color text not null default '#111111',
  bank_account_name text not null default 'R.H.V.R.Pramod',
  bank_account_number text not null default '89121867',
  bank_name text not null default 'BOC (Bank of Ceylon)',
  bank_branch text not null default 'Weligama',
  default_invoice_notes text not null default 'This fee covers only the review, planning, and configuration services listed. Third-party subscriptions, domain charges, and storage upgrades are not included.',
  whatsapp_invoice_template text not null default 'Hello {customer}, please find your Invoice {number} for {project}. Total: LKR {total}. View/download: {link}. Thank you, CodeCrew.',
  whatsapp_quotation_template text not null default 'Hello {customer}, please find your Quotation {number} for {project}. Total: LKR {total}. View/download: {link}. Thank you, CodeCrew.',
  invoice_prefix text not null default 'INV',
  quotation_prefix text not null default 'QUO',
  updated_at timestamptz not null default now()
);

-- COUNTERS (Atomic per-year document number sequence generator)
create table if not exists public.counters (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('quotation', 'invoice')),
  year integer not null,
  last_number integer not null default 0,
  unique(doc_type, year)
);

-- 3. INDEXES
create index if not exists idx_customers_name on public.customers(name);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_projects_customer_id on public.projects(customer_id);
create index if not exists idx_projects_project_date on public.projects(project_date);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_project_members_proj on public.project_members(project_id);
create index if not exists idx_income_payments_proj on public.income_payments(project_id);
create index if not exists idx_income_payments_date on public.income_payments(payment_date);
create index if not exists idx_expenses_project_id on public.expenses(project_id);
create index if not exists idx_expenses_date on public.expenses(expense_date);
create index if not exists idx_expenses_type on public.expenses(type);
create index if not exists idx_expenses_platform on public.expenses(platform);
create index if not exists idx_documents_project_id on public.documents(project_id);
create index if not exists idx_documents_customer_id on public.documents(customer_id);
create index if not exists idx_documents_number on public.documents(number);
create index if not exists idx_documents_share_token on public.documents(share_token);
create index if not exists idx_document_items_doc_id on public.document_items(document_id);

-- 4. SECURITY DEFINER HELPER FUNCTIONS

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

create or replace function public.is_active()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$;

create or replace function public.has_project_access(p_project_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select (
    public.is_admin()
    or (
      public.is_active()
      and exists (
        select 1 from public.project_members
        where project_id = p_project_id and user_id = auth.uid()
      )
    )
  );
$$;

-- ATOMIC DOCUMENT NUMBER GENERATOR
create or replace function public.next_document_number(p_type text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_year integer := extract(year from current_date);
  v_prefix text;
  v_next_val integer;
begin
  if not (public.is_active()) then
    raise exception 'Unauthorized: caller is inactive or not logged in';
  end if;

  if p_type = 'invoice' then
    select coalesce(invoice_prefix, 'INV') into v_prefix from public.settings where id = 1;
    v_prefix := coalesce(v_prefix, 'INV');
  elsif p_type = 'quotation' then
    select coalesce(quotation_prefix, 'QUO') into v_prefix from public.settings where id = 1;
    v_prefix := coalesce(v_prefix, 'QUO');
  else
    raise exception 'Invalid document type: %', p_type;
  end if;

  -- Insert counter row if not exists, lock row with FOR UPDATE
  insert into public.counters (doc_type, year, last_number)
  values (p_type, v_year, 0)
  on conflict (doc_type, year) do nothing;

  select last_number + 1 into v_next_val
  from public.counters
  where doc_type = p_type and year = v_year
  for update;

  update public.counters
  set last_number = v_next_val
  where doc_type = p_type and year = v_year;

  return v_prefix || '-' || v_year || '-' || lpad(v_next_val::text, 3, '0');
end;
$$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.income_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.documents enable row level security;
alter table public.document_items enable row level security;
alter table public.settings enable row level security;
alter table public.counters enable row level security;

-- PROFILES POLICIES
create policy "Active users can view active profiles"
  on public.profiles for select
  using (public.is_active());

create policy "Admin has full access to profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can update their own profile name"
  on public.profiles for update
  using (auth.uid() = id and public.is_active())
  with check (auth.uid() = id and public.is_active());

-- CUSTOMERS POLICIES
create policy "Active users can read customers"
  on public.customers for select
  using (public.is_active());

create policy "Active users can insert customers"
  on public.customers for insert
  with check (public.is_active());

create policy "Active users can update customers"
  on public.customers for update
  using (public.is_active());

create policy "Admin can delete customers"
  on public.customers for delete
  using (public.is_admin());

-- PROJECTS POLICIES
create policy "Users can view assigned projects"
  on public.projects for select
  using (public.has_project_access(id));

create policy "Admin can insert projects"
  on public.projects for insert
  with check (public.is_admin());

create policy "Users can update assigned projects"
  on public.projects for update
  using (public.has_project_access(id));

create policy "Admin can delete projects"
  on public.projects for delete
  using (public.is_admin());

-- PROJECT MEMBERS POLICIES
create policy "Users can view members of accessible projects"
  on public.project_members for select
  using (public.has_project_access(project_id));

create policy "Admin can manage project members"
  on public.project_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- INCOME PAYMENTS POLICIES
create policy "Users can view payments for accessible projects"
  on public.income_payments for select
  using (public.has_project_access(project_id));

create policy "Users can add payments to accessible projects"
  on public.income_payments for insert
  with check (public.has_project_access(project_id));

create policy "Admin can update or delete payments"
  on public.income_payments for all
  using (public.is_admin())
  with check (public.is_admin());

-- EXPENSES POLICIES
create policy "Users can view expenses for accessible projects or general overhead"
  on public.expenses for select
  using (
    public.is_admin()
    or (public.is_active() and (project_id is null or public.has_project_access(project_id)))
  );

create policy "Users can insert expenses for accessible projects"
  on public.expenses for insert
  with check (
    public.is_admin()
    or (public.is_active() and (project_id is null or public.has_project_access(project_id)))
  );

create policy "Users can update expenses for accessible projects"
  on public.expenses for update
  using (
    public.is_admin()
    or (public.is_active() and (project_id is null or public.has_project_access(project_id)))
  );

create policy "Users or Admin can delete expenses"
  on public.expenses for delete
  using (
    public.is_admin()
    or (public.is_active() and (created_by = auth.uid() or public.has_project_access(project_id)))
  );

-- DOCUMENTS POLICIES
create policy "Users can view documents of accessible projects"
  on public.documents for select
  using (public.has_project_access(project_id));

create policy "Public can view document by valid share token"
  on public.documents for select
  using (share_token is not null);

create policy "Users can insert documents for accessible projects"
  on public.documents for insert
  with check (public.has_project_access(project_id));

create policy "Users can update documents for accessible projects"
  on public.documents for update
  using (public.has_project_access(project_id));

create policy "Admin can delete documents"
  on public.documents for delete
  using (public.is_admin());

-- DOCUMENT ITEMS POLICIES
create policy "Users can view document items"
  on public.document_items for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_items.document_id
      and (public.has_project_access(d.project_id) or d.share_token is not null)
    )
  );

create policy "Users can manage items of accessible documents"
  on public.document_items for all
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_items.document_id
      and public.has_project_access(d.project_id)
    )
  );

-- SETTINGS POLICIES
create policy "Active users can view settings"
  on public.settings for select
  using (public.is_active() or auth.role() = 'anon'); -- Anon allowed for public document view branding

create policy "Admin can update settings"
  on public.settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- COUNTERS POLICIES
create policy "Active users can read and update counters"
  on public.counters for all
  using (public.is_active());

-- 6. VIEWS AND RPC FUNCTIONS

-- PROJECT SUMMARY VIEW
create or replace view public.project_summary as
select
  p.id,
  p.name,
  p.customer_id,
  c.name as customer_name,
  c.company as customer_company,
  c.phone as customer_phone,
  p.project_date,
  p.price as income,                                      -- Client Price (invoice total)
  p.outsourcer_name,
  p.outsourcer_cost,                                      -- What we pay outsourcer
  p.broker_name,
  p.broker_commission,                                    -- What we pay broker
  (p.price - p.outsourcer_cost - p.broker_commission) as my_profit,  -- Net profit for us
  case
    when p.price > 0 then round(((p.price - p.outsourcer_cost - p.broker_commission) / p.price * 100), 2)
    else 0.00
  end as margin_pct,
  coalesce(ip.total_paid, 0.00) as total_paid,
  (p.price - coalesce(ip.total_paid, 0.00)) as balance,
  coalesce(e.total_expenses, 0.00) as total_ad_expenses,  -- Additional ad/expenses logged
  (p.price - p.outsourcer_cost - p.broker_commission - coalesce(e.total_expenses, 0.00)) as net_profit,
  p.status,
  p.notes,
  p.created_at,
  p.updated_at
from public.projects p
left join public.customers c on p.customer_id = c.id
left join (
  select project_id, sum(amount) as total_paid
  from public.income_payments
  group by project_id
) ip on ip.project_id = p.id
left join (
  select project_id, sum(amount) as total_expenses
  from public.expenses
  where project_id is not null
  group by project_id
) e on e.project_id = p.id;

-- DASHBOARD KPIS RPC
create or replace function public.dashboard_kpis(from_date date default null, to_date date default null)
returns table (
  total_income numeric,
  total_expenses numeric,
  net_profit numeric,
  outstanding_balance numeric,
  active_projects_count bigint
) language plpgsql security definer set search_path = public stable as $$
declare
  v_from date := coalesce(from_date, date_trunc('month', current_date)::date);
  v_to date := coalesce(to_date, current_date);
  v_income numeric;
  v_expenses numeric;
  v_balance numeric;
  v_active_count bigint;
begin
  if not public.is_active() then
    raise exception 'Unauthorized';
  end if;

  -- Total income from projects created in range
  select coalesce(sum(price), 0.00)
  into v_income
  from public.projects
  where project_date between v_from and v_to;

  -- Total expenses in range
  select coalesce(sum(amount), 0.00)
  into v_expenses
  from public.expenses
  where expense_date between v_from and v_to;

  -- Outstanding balance across active projects
  select coalesce(sum(p.price - coalesce(ip.paid, 0.00)), 0.00)
  into v_balance
  from public.projects p
  left join (
    select project_id, sum(amount) as paid
    from public.income_payments
    group by project_id
  ) ip on ip.project_id = p.id
  where p.status = 'active';

  -- Active projects count
  select count(*)
  into v_active_count
  from public.projects
  where status = 'active';

  return query select
    v_income,
    v_expenses,
    (v_income - v_expenses) as net_profit,
    v_balance,
    v_active_count;
end;
$$;

-- MONTHLY SERIES RPC (For Dashboard Chart)
create or replace function public.monthly_series(from_date date default null, to_date date default null)
returns table (
  month_date date,
  month_label text,
  income numeric,
  expenses numeric,
  profit numeric
) language plpgsql security definer set search_path = public stable as $$
declare
  v_from date := coalesce(from_date, (current_date - interval '5 months')::date);
  v_to date := coalesce(to_date, current_date);
begin
  if not public.is_active() then
    raise exception 'Unauthorized';
  end if;

  return query
  with months as (
    select generate_series(
      date_trunc('month', v_from),
      date_trunc('month', v_to),
      interval '1 month'
    )::date as m_start
  ),
  month_income as (
    select date_trunc('month', project_date)::date as m_date, sum(price) as inc
    from public.projects
    where project_date >= date_trunc('month', v_from) and project_date <= v_to
    group by 1
  ),
  month_expense as (
    select date_trunc('month', expense_date)::date as m_date, sum(amount) as exp
    from public.expenses
    where expense_date >= date_trunc('month', v_from) and expense_date <= v_to
    group by 1
  )
  select
    m.m_start as month_date,
    to_char(m.m_start, 'Mon YYYY') as month_label,
    coalesce(mi.inc, 0.00) as income,
    coalesce(me.exp, 0.00) as expenses,
    (coalesce(mi.inc, 0.00) - coalesce(me.exp, 0.00)) as profit
  from months m
  left join month_income mi on mi.m_date = m.m_start
  left join month_expense me on me.m_date = m.m_start
  order by m.m_start asc;
end;
$$;

-- LEDGER RPC (Unified date-wise income payments & expenses with running balance)
create or replace function public.ledger(from_date date default null, to_date date default null)
returns table (
  id uuid,
  entry_date date,
  type text, -- 'income' or 'expense'
  title text,
  project_id uuid,
  project_name text,
  category_or_platform text,
  amount numeric,
  running_balance numeric
) language plpgsql security definer set search_path = public stable as $$
declare
  v_from date := coalesce(from_date, (current_date - interval '90 days')::date);
  v_to date := coalesce(to_date, current_date);
begin
  if not public.is_active() then
    raise exception 'Unauthorized';
  end if;

  return query
  with unioned as (
    -- Income payments
    select
      ip.id,
      ip.payment_date as entry_date,
      'income'::text as type,
      coalesce(ip.note, 'Project Income Payment') as title,
      ip.project_id,
      p.name as project_name,
      'Income'::text as category_or_platform,
      ip.amount as amount,
      ip.created_at
    from public.income_payments ip
    join public.projects p on p.id = ip.project_id
    where ip.payment_date between v_from and v_to

    union all

    -- Expenses
    select
      e.id,
      e.expense_date as entry_date,
      'expense'::text as type,
      e.description as title,
      e.project_id,
      p.name as project_name,
      case 
        when e.type = 'advertisement' then coalesce(e.platform, 'Ad')
        else coalesce(e.category, 'General')
      end as category_or_platform,
      e.amount as amount,
      e.created_at
    from public.expenses e
    left join public.projects p on p.id = e.project_id
    where e.expense_date between v_from and v_to
  )
  select
    u.id,
    u.entry_date,
    u.type,
    u.title,
    u.project_id,
    u.project_name,
    u.category_or_platform,
    u.amount,
    sum(
      case when u.type = 'income' then u.amount else -u.amount end
    ) over (order by u.entry_date asc, u.created_at asc) as running_balance
  from unioned u
  order by u.entry_date desc, u.created_at desc;
end;
$$;

-- 7. TRIGGERS

-- Auto update updated_at timestamp
create or replace function public.trigger_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.trigger_set_updated_at();

create trigger set_customers_updated_at before update on public.customers
  for each row execute function public.trigger_set_updated_at();

create trigger set_projects_updated_at before update on public.projects
  for each row execute function public.trigger_set_updated_at();

create trigger set_income_payments_updated_at before update on public.income_payments
  for each row execute function public.trigger_set_updated_at();

create trigger set_expenses_updated_at before update on public.expenses
  for each row execute function public.trigger_set_updated_at();

create trigger set_documents_updated_at before update on public.documents
  for each row execute function public.trigger_set_updated_at();

create trigger set_document_items_updated_at before update on public.document_items
  for each row execute function public.trigger_set_updated_at();

create trigger set_settings_updated_at before update on public.settings
  for each row execute function public.trigger_set_updated_at();

-- Auto create profile on auth.users sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
  v_role text := 'member';
begin
  select count(*) into v_count from public.profiles;
  -- If first user ever registered, make them admin!
  if v_count = 0 then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, email, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    true
  )
  on conflict (id) do update set
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger to recalculate invoice status when payments are recorded
create or replace function public.handle_payment_status_sync()
returns trigger language plpgsql as $$
declare
  v_project_id uuid := coalesce(new.project_id, old.project_id);
  v_price numeric;
  v_paid numeric;
begin
  select price into v_price from public.projects where id = v_project_id;
  select coalesce(sum(amount), 0.00) into v_paid from public.income_payments where project_id = v_project_id;

  -- Auto update invoices for this project if not draft
  if v_paid >= v_price and v_price > 0 then
    update public.documents
    set status = 'paid'
    where project_id = v_project_id and type = 'invoice' and status in ('sent', 'partially_paid');
  elsif v_paid > 0 and v_paid < v_price then
    update public.documents
    set status = 'partially_paid'
    where project_id = v_project_id and type = 'invoice' and status in ('sent');
  end if;

  return null;
end;
$$;

create trigger on_payment_change_update_invoice
  after insert or update or delete on public.income_payments
  for each row execute function public.handle_payment_status_sync();

-- 8. STORAGE BUCKET FOR DOCUMENTS
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Authenticated active users can read documents bucket"
  on storage.objects for select
  using (bucket_id = 'documents' and (public.is_active() or true));

create policy "Authenticated users can upload document PDFs"
  on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_active());

create policy "Admin can delete document PDFs"
  on storage.objects for delete
  using (bucket_id = 'documents' and public.is_admin());

-- ============================================================================
-- 9. AD CAMPAIGN LEDGER & PROFIT TRACKER MODULE
-- ============================================================================

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_code text not null unique,
  name text not null,
  fb_campaign_ref text,
  start_date date not null default current_date,
  end_date date,
  status text not null default 'running' check (status in ('running', 'review', 'closed')),
  ad_spend_usd numeric(12, 2) not null default 0.00 check (ad_spend_usd >= 0),
  exchange_rate numeric(12, 2) not null default 305.00 check (exchange_rate > 0),
  ad_spend_lkr numeric(14, 2) not null default 0.00 check (ad_spend_lkr >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaign_orders (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.ad_campaigns(id) on delete set null,
  order_number text not null,
  order_name text not null,
  customer_name text,
  customer_phone text,
  order_date date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_order_services (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ad_campaign_orders(id) on delete cascade,
  position integer not null default 0,
  service_name text not null,
  supplier_type text not null default 'outsourced' check (supplier_type in ('in_house', 'outsourced')),
  supplier_cost numeric(14, 2),
  markup numeric(14, 2),
  client_price numeric(14, 2),
  is_financial_pending boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaign_expenses (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  category text not null default 'Packaging' check (category in ('Packaging', 'Delivery', 'Material purchases', 'Operational', 'Other')),
  description text not null,
  expense_date date not null default current_date,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'LKR' check (currency in ('LKR', 'USD')),
  exchange_rate numeric(12, 2) not null default 305.00 check (exchange_rate > 0),
  amount_lkr numeric(14, 2) not null default 0.00 check (amount_lkr >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ad_campaigns_status on public.ad_campaigns(status);
create index if not exists idx_ad_campaigns_start_date on public.ad_campaigns(start_date);
create index if not exists idx_ad_campaign_orders_campaign_id on public.ad_campaign_orders(campaign_id);
create index if not exists idx_ad_campaign_orders_status on public.ad_campaign_orders(status);
create index if not exists idx_ad_campaign_orders_date on public.ad_campaign_orders(order_date);
create index if not exists idx_ad_order_services_order_id on public.ad_order_services(order_id);
create index if not exists idx_ad_campaign_expenses_campaign_id on public.ad_campaign_expenses(campaign_id);

drop trigger if exists set_ad_campaigns_updated_at on public.ad_campaigns;
create trigger set_ad_campaigns_updated_at before update on public.ad_campaigns
  for each row execute function public.trigger_set_updated_at();

drop trigger if exists set_ad_campaign_orders_updated_at on public.ad_campaign_orders;
create trigger set_ad_campaign_orders_updated_at before update on public.ad_campaign_orders
  for each row execute function public.trigger_set_updated_at();

drop trigger if exists set_ad_order_services_updated_at on public.ad_order_services;
create trigger set_ad_order_services_updated_at before update on public.ad_order_services
  for each row execute function public.trigger_set_updated_at();

drop trigger if exists set_ad_campaign_expenses_updated_at on public.ad_campaign_expenses;
create trigger set_ad_campaign_expenses_updated_at before update on public.ad_campaign_expenses
  for each row execute function public.trigger_set_updated_at();

alter table public.ad_campaigns enable row level security;
alter table public.ad_campaign_orders enable row level security;
alter table public.ad_order_services enable row level security;
alter table public.ad_campaign_expenses enable row level security;

create policy "Allow all read on ad_campaigns" on public.ad_campaigns for select using (true);
create policy "Allow all insert on ad_campaigns" on public.ad_campaigns for insert with check (true);
create policy "Allow all update on ad_campaigns" on public.ad_campaigns for update using (true);
create policy "Allow all delete on ad_campaigns" on public.ad_campaigns for delete using (true);

create policy "Allow all read on ad_campaign_orders" on public.ad_campaign_orders for select using (true);
create policy "Allow all insert on ad_campaign_orders" on public.ad_campaign_orders for insert with check (true);
create policy "Allow all update on ad_campaign_orders" on public.ad_campaign_orders for update using (true);
create policy "Allow all delete on ad_campaign_orders" on public.ad_campaign_orders for delete using (true);

create policy "Allow all read on ad_order_services" on public.ad_order_services for select using (true);
create policy "Allow all insert on ad_order_services" on public.ad_order_services for insert with check (true);
create policy "Allow all update on ad_order_services" on public.ad_order_services for update using (true);
create policy "Allow all delete on ad_order_services" on public.ad_order_services for delete using (true);

create policy "Allow all read on ad_campaign_expenses" on public.ad_campaign_expenses for select using (true);
create policy "Allow all insert on ad_campaign_expenses" on public.ad_campaign_expenses for insert with check (true);
create policy "Allow all update on ad_campaign_expenses" on public.ad_campaign_expenses for update using (true);
create policy "Allow all delete on ad_campaign_expenses" on public.ad_campaign_expenses for delete using (true);
