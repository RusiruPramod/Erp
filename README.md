# CodeCrew ERP

A fast, lightweight, and modern internal ERP built specifically for **CodeCrew** (Sri Lanka). Designed to track project income, advertising expenses (Facebook, Google, TikTok, Instagram, etc.), net profit, and generate client Invoices & Quotations with instant WhatsApp delivery.

---

## 🚀 Key Features

- **Project Kickoff & Income:** Every project records project price as business income. Partial payment installments track paid vs remaining balance.
- **Date-wise Ad & Expense Timeline:** Quick-add row with Enter key saving to log ad spend across Facebook, Instagram, Google Ads, TikTok, YouTube, and other platforms.
- **Real-Time Profitability:** SQL-calculated net profit, margin percentages, and monthly series trends computed directly in Postgres.
- **Invoice & Quotation Generator:**
  - Sequential per-year numbers: `INV-2026-001`, `QUO-2026-001` with atomic database row-locking.
  - 1-click Quotation to Invoice conversion.
  - Exact CodeCrew PDF template styling with `@react-pdf/renderer` (orange brand logo, From & Bill To columns, line item hours/prices, beneficiary bank details, and terms).
- **Direct WhatsApp Delivery (`wa.me`):** Instant click-to-chat links pre-filled with customer phone (auto-normalized to `94XXXXXXXXX`), document numbers, and a 7-day public share URL (`/d/:token`) where clients can view and download their PDF without logging in.
- **Role-Based Security:** Row Level Security (RLS) policies for administrators and team members. Members only access assigned projects; admins manage team members, deactivations, and password resets via Supabase Edge Functions.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS (Clean White & Brand Orange `#FF8C00` Theme)
- **Icons & Data:** Lucide React, TanStack Query v5, Recharts, Date-fns, Sonner, React Hook Form, Zod
- **Backend:** Supabase (PostgreSQL, Supabase Auth, Row Level Security, Supabase Storage, Edge Functions)
- **Deployment:** Vercel SPA (`vercel.json`)

---

## 📦 Setup & Deployment Guide

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings > API**, copy:
   - **Project URL**
   - **anon public key**
   - **service_role secret** (Keep private! Do NOT put into client `.env`).

### 2. Run Database Schema & Seeds
1. Open the **SQL Editor** in your Supabase dashboard.
2. Copy and paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
   - This sets up tables, atomic counters, security definer functions (`is_admin`, `has_project_access`, `next_document_number`), RLS policies, views (`project_summary`), and RPCs (`dashboard_kpis`, `monthly_series`, `ledger`).
3. Copy and paste the contents of [`supabase/seed.sql`](./supabase/seed.sql) and click **Run**.
   - This initializes default CodeCrew business info, BOC bank details, sample customer (InterMax), sample project, ad expenses, and initial invoice.

### 3. Deploy Supabase Edge Function (`create-member`)
Ensure you have the Supabase CLI installed (`npm install -g supabase`):
```bash
# Login to Supabase CLI
supabase login

# Link your local project to your Supabase project
supabase link --project-ref your-project-ref

# Deploy the create-member edge function
supabase functions deploy create-member --no-verify-jwt
```
> Note: The Edge Function automatically has access to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` inside Supabase.

### 4. Create the First Admin User
The database trigger in `schema.sql` automatically grants the **admin** role to the first user registered in your Supabase project!
1. Start the app locally and navigate to `/login` or create a user in **Supabase Dashboard > Authentication > Users**.
2. If you already have users and want to promote one to administrator manually, run:
```sql
UPDATE public.profiles
SET role = 'admin', active = true
WHERE email = 'rusirupramod@gmail.com';
```

### 5. Local Development
1. Clone this repository and install dependencies:
```bash
npm install
```
2. Create `.env` from `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
3. Run the development server:
```bash
npm run dev
```

### 6. Build & Test
Validate that TypeScript compiles cleanly:
```bash
npm run build
```

### 7. Deploy to Vercel
1. Push your code to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. The included `vercel.json` ensures full SPA client-side routing support and immutable static asset caching.
