-- ============================================================================
-- CodeCrew ERP - Ad Campaign Ledger & Profit Tracking Module
-- Supabase Database Schema, Tables, Indexes, and Security Policies
-- ============================================================================

-- 1. AD CAMPAIGNS TABLE
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

-- 2. AD CAMPAIGN ORDERS TABLE
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

-- 3. AD ORDER SERVICES TABLE
create table if not exists public.ad_order_services (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ad_campaign_orders(id) on delete cascade,
  position integer not null default 0,
  service_name text not null,
  supplier_type text not null default 'outsourced' check (supplier_type in ('in_house', 'outsourced')),
  supplier_cost numeric(14, 2), -- Nullable when pricing is pending/unknown
  markup numeric(14, 2),        -- Nullable when pending
  client_price numeric(14, 2),  -- Nullable when pending
  is_financial_pending boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. AD CAMPAIGN EXPENSES TABLE (Operational costs: Packaging, Delivery, Materials)
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

-- 5. INDEXES
create index if not exists idx_ad_campaigns_status on public.ad_campaigns(status);
create index if not exists idx_ad_campaigns_start_date on public.ad_campaigns(start_date);
create index if not exists idx_ad_campaign_orders_campaign_id on public.ad_campaign_orders(campaign_id);
create index if not exists idx_ad_campaign_orders_status on public.ad_campaign_orders(status);
create index if not exists idx_ad_campaign_orders_date on public.ad_campaign_orders(order_date);
create index if not exists idx_ad_order_services_order_id on public.ad_order_services(order_id);
create index if not exists idx_ad_campaign_expenses_campaign_id on public.ad_campaign_expenses(campaign_id);

-- 6. TRIGGERS FOR UPDATED_AT
create or replace function public.trigger_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.ad_campaigns enable row level security;
alter table public.ad_campaign_orders enable row level security;
alter table public.ad_order_services enable row level security;
alter table public.ad_campaign_expenses enable row level security;

-- AD CAMPAIGNS POLICIES
create policy "Allow all read on ad_campaigns"
  on public.ad_campaigns for select
  using (true);

create policy "Allow all insert on ad_campaigns"
  on public.ad_campaigns for insert
  with check (true);

create policy "Allow all update on ad_campaigns"
  on public.ad_campaigns for update
  using (true);

create policy "Allow all delete on ad_campaigns"
  on public.ad_campaigns for delete
  using (true);

-- AD ORDERS POLICIES
create policy "Allow all read on ad_campaign_orders"
  on public.ad_campaign_orders for select
  using (true);

create policy "Allow all insert on ad_campaign_orders"
  on public.ad_campaign_orders for insert
  with check (true);

create policy "Allow all update on ad_campaign_orders"
  on public.ad_campaign_orders for update
  using (true);

create policy "Allow all delete on ad_campaign_orders"
  on public.ad_campaign_orders for delete
  using (true);

-- AD ORDER SERVICES POLICIES
create policy "Allow all read on ad_order_services"
  on public.ad_order_services for select
  using (true);

create policy "Allow all insert on ad_order_services"
  on public.ad_order_services for insert
  with check (true);

create policy "Allow all update on ad_order_services"
  on public.ad_order_services for update
  using (true);

create policy "Allow all delete on ad_order_services"
  on public.ad_order_services for delete
  using (true);

-- AD EXPENSES POLICIES
create policy "Allow all read on ad_campaign_expenses"
  on public.ad_campaign_expenses for select
  using (true);

create policy "Allow all insert on ad_campaign_expenses"
  on public.ad_campaign_expenses for insert
  with check (true);

create policy "Allow all update on ad_campaign_expenses"
  on public.ad_campaign_expenses for update
  using (true);

create policy "Allow all delete on ad_campaign_expenses"
  on public.ad_campaign_expenses for delete
  using (true);

