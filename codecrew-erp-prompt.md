# MASTER PROMPT: CodeCrew ERP (Income / Expense / Invoice / Quotation)

You are a senior full-stack engineer and UI/UX designer. Build the COMPLETE system below in ONE SHOT, production-ready, with no placeholders, no TODOs, no "implement later". Do not ask me questions; where something is unspecified, choose the simplest sensible option. Output every file in full.

---

## 1. WHAT THIS IS

A simple internal ERP for **CodeCrew** (a small software/service business in Sri Lanka). It is NOT a stock/inventory system. There is NO stock, NO products, NO warehouse. Keep it simple. Do NOT add extra modules (no HR, payroll, CRM, inventory, multi-currency, etc.).

Currency: **LKR** (format `LKR 30,000.00`). Timezone: Asia/Colombo.

## 2. MY BUSINESS PROCESS (build exactly this flow)

1. I run **advertisements** (Facebook/Meta, Google, TikTok, etc.current only facebook meta adds) for customers' projects and spend money on them.
2. For every **Project** I create a record: project name, customer, date, and **project price (income)**. This is saved to the database as income.
3. Under each project I add **Ad / Expense entries date-wise** (date, ad platform, description, amount). These are the outcome (expenses). I can also add other expenses (non-ad) with a category.
4. The system shows per project: total income, total expenses, **net profit**, and a date-wise expense timeline. Globally it shows total income / outcome / profit with date-range filters.
5. After finishing the project task, when the customer asks for an **Invoice** or **Quotation**, I generate it from the project in 2-3 clicks (line items editable), preview it as PDF, download it, and **send it via WhatsApp** to the customer.

That is the whole product. Everything must support this flow.

## 3. TECH STACK (fixed)

- **React 18 + Vite + TypeScript**
- **Tailwind CSS** (white theme, see design section)
- **Supabase** (Postgres, Auth, Row Level Security, Storage, one Edge Function)
- **Vercel** deployment (include `vercel.json` with SPA rewrite)
- Libraries (keep minimal): `react-router-dom`, `@supabase/supabase-js`, `@tanstack/react-query`, `@react-pdf/renderer`, `react-hook-form` + `zod`, `lucide-react`, `date-fns`, `recharts` (dashboard chart only), `sonner` (toasts)

## 4. FEATURES

### 4.1 Auth and Team (login-based)
- Email + password login via Supabase Auth. No public signup page.
- Roles: **admin** and **member**.
- **Admin can add new members** from a "Team" page: name, email, temporary password, role, and assign which projects they can access (or "all projects").
- Creating a user needs the service role key, so implement it as a **Supabase Edge Function `create-member`** (verifies caller is admin via JWT, uses `auth.admin.createUser`, inserts into `profiles`). Also provide `deactivate-member` behavior (set `profiles.active=false`; blocked users cannot read data).
- Admin can edit role, activate/deactivate, reset a member's password (via the same Edge Function).
- Member permissions: can view assigned projects, add expenses to assigned projects, create quotations/invoices for assigned projects. Members CANNOT manage team, delete projects, or see the global Settings. Admin sees everything.
- The first admin is seeded via SQL (provide the instructions and SQL snippet in the README).

### 4.2 Projects
- Fields: `name`, `customer_id`, `project_date`, `price` (income), `status` (`active` | `completed` | `cancelled`), `notes`.
- Projects list: search, status filter, date filter, columns for name, customer, date, price, expenses, profit, status. Server-side pagination (20 per page).
- Project detail page with tabs: **Overview** (price, expenses, profit, margin, mini chart), **Expenses** (date-wise table + quick-add form), **Documents** (quotations and invoices list for this project + "Create Quotation" / "Create Invoice" buttons).
- Income is recorded at project creation via the `price` field (and optional **income payments**: allow adding partial payments with date/amount/note so I can track paid vs balance; invoice shows balance).

### 4.3 Customers
- Simple: `name`, `company`, `phone` (WhatsApp number, stored in international format, default country code +94 with normalization of numbers like `0772078626` → `94772078626`), `email`, `address`. Inline "add customer" from the project form.

### 4.4 Expenses (outcome)
- Fields: `project_id` (nullable for general business expenses), `expense_date`, `type` (`advertisement` | `other`), `platform` (Facebook, Instagram, Google, TikTok, YouTube, Other; only for ads), `category` (for other), `description`, `amount`.
- Fast entry: a quick-add row at the top of the table (date defaults to today, Enter to save). Edit and delete inline.
- Global Expenses page with filters (date range, project, type, platform) and totals.

### 4.5 Ledger / Dashboard
- Dashboard: KPI cards (Total Income, Total Expenses, Net Profit, Outstanding balance), date range selector (This month, Last month, This year, Custom), line/bar chart of income vs expenses by month, "Top projects by profit", "Recent expenses", "Recent documents".
- Ledger page: unified date-wise list of every income payment and every expense with running totals, filterable and exportable to **CSV**.
- All aggregation done in Postgres via **views / RPC functions** (not in the browser) for speed.

### 4.6 Quotation and Invoice generator
- Create from a project (auto-fills customer and a first line item from the project name/price). Fully editable line items: `service task`, `description notes`, `est. hours` (optional), `price` (a line can show "Included" if price is 0 and the flag `show_included` is on), plus discount, and notes.
- Numbering: sequential and per-year, generated in the database, safe against race conditions: `INV-2026-001`, `QUO-2026-001`.
- Status: Quotation (`draft`, `sent`, `accepted`, `rejected`), Invoice (`draft`, `sent`, `partially_paid`, `paid`, `overdue`). **Convert quotation → invoice** with one click.
- **PDF design must follow my template below exactly** (same layout, structure, and colors), built with `@react-pdf/renderer`: 
  - Header: logo text "Code" in orange `#FF8C00` + "Crew" in black on the left, big uppercase title `INVOICE` (or `QUOTATION`) on the right.
  - Two columns: **From** (business details) and **Bill To** (customer details), each with a bottom-bordered heading.
  - Meta block: Invoice Number, Invoice Date, Project.
  - Table with 1px black borders and header row `#f0f0f0`: Service Task (25%), Description Notes (45%), Est. Hours (15%, centered), Price (LKR) (15%, right-aligned).
  - Bottom section: left box with **Payment / Beneficiary Details** (bg `#fafafa`, 1px border), right side with Total Hours and **Total Amount Due: LKR X**, and a Notes block (9px, `#444`).
  - A4, padding 40, Helvetica, base font 10.
  - Business details and bank details come from the **Settings** page (not hard-coded), seeded with my defaults below.
- Live PDF preview in the page (use `PDFViewer` lazily loaded, code-split so it does not slow the main bundle), a Download PDF button.
- **Send via WhatsApp**: 
  1. Generate the PDF blob, upload to Supabase Storage bucket `documents` (private), create a **signed URL valid 7 days** (or a public share token page `/d/:token` that renders/downloads the PDF without login, recommended).
  2. Open `https://wa.me/<customer_whatsapp_number>?text=<encoded message>` in a new tab with an editable message template, e.g.: "Hello {customer}, please find your {Invoice/Quotation} {number} for {project}. Total: LKR {total}. View/download: {link}. Thank you, CodeCrew."
  3. Mark the document `sent` and store `sent_at`. Also provide a "Copy link" button and a plain "Download PDF" fallback.
  (No WhatsApp Business API needed; the wa.me click-to-chat approach is fine and free.)

### 4.7 Settings (admin only)
- Business profile: name (CodeCrew), owner name, mobile, email, address, logo text colors.
- Bank details: account name, account number, bank, branch.
- Default invoice notes, default WhatsApp message templates, numbering prefix.

**Seed defaults for Settings (from my current invoice):**
- From: R.H.V.R.Pramod, Mobile 0755437148, Email rusirupramod@gmail.com
- Bank: Account Name R.H.V.R.Pramod, Account No 89121867, Bank BOC (Bank of Ceylon), Branch Weligama
- Default note: "This fee covers only the review, planning, and configuration services listed. Third-party subscriptions, domain charges, and storage upgrades are not included."
- Sample customer: Shamshard Marikkar (Managing Director), InterMax (Pvt) Ltd., 435/2, Dutugemunu Rd, Koswatte, Battaramulla, Sri Lanka, Phone +94 77 207 8626, Email intermaxsrilanka@gmail.com
- Sample project: "Google Workspace File Sync" with 3 line items (Technical Review 3h, Requirement & Architecture 4h, Configuration Part 5h; total 12 hours, LKR 30,000.00)

## 5. DATABASE (Supabase / Postgres) — provide ONE complete `schema.sql`

Tables (all with `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at`, `created_by`):
`profiles` (id = auth.users.id, full_name, email, role, active), `customers`, `projects`, `project_members` (project_id, user_id), `income_payments`, `expenses`, `documents` (type quotation|invoice, number, project_id, customer_id, status, issue_date, due_date, discount, notes, total, share_token, pdf_path, sent_at), `document_items` (document_id, position, task, description, hours, price, show_included), `settings` (single row, jsonb or columns), `counters` (doc_type, year, last_number) with a function `next_document_number(type)` using row locking.

Requirements:
- **Row Level Security enabled on every table.** Policies: admin full access; member access only to projects in `project_members` (and related expenses/documents/payments); inactive profiles get nothing. Use a `security definer` helper `is_admin()` and `has_project_access(project_id)`.
- Indexes on all foreign keys, `expense_date`, `project_date`, `documents(number)`.
- Views/RPCs: `project_summary` (income, paid, expenses, profit, balance), `dashboard_kpis(from,to)`, `monthly_series(from,to)`, `ledger(from,to)`.
- Triggers: `updated_at`, auto-create `profiles` row, recalc document status when payments change.
- Storage bucket `documents` with RLS policies.
- Seed SQL for the first admin and the sample data above (separate file `seed.sql`).

## 6. ARCHITECTURE (well structured, scalable)

Feature-based folders:
```
src/
  app/            (router, providers, layout)
  components/ui/  (Button, Input, Select, Modal, Table, Badge, Card, Skeleton, EmptyState, ConfirmDialog, DateRangePicker)
  features/auth | dashboard | projects | customers | expenses | ledger | documents | team | settings
  lib/            (supabase client, formatters, whatsapp, phone, csv, pdf templates)
  hooks/ types/ 
supabase/ (schema.sql, seed.sql, functions/create-member/index.ts)
```
- Typed Supabase client (generate/handwrite `database.types.ts`).
- TanStack Query for all data with sensible `staleTime`, optimistic updates for expense add/delete, and invalidation by key.
- Zod schemas shared by forms; React Hook Form everywhere.
- Route guards (`RequireAuth`, `RequireAdmin`). Central error boundary and toasts.

## 7. PERFORMANCE (must be fast)

- Route-level code splitting with `React.lazy`; `@react-pdf/renderer` and `recharts` loaded only on the pages that need them.
- Server-side pagination, filtering, and aggregation; select only needed columns; no N+1 queries.
- Skeleton loaders instead of spinners; instant navigation feel; debounce search (300ms).
- Vite manual chunks, preconnect to Supabase, asset caching headers in `vercel.json`.
- Target Lighthouse performance 90+ on mobile.

## 8. UI/UX DESIGN (white theme, based on my invoice colors)

- **White theme only.** Background `#FFFFFF`/`#FAFAFA`, text `#111111`, borders `#E5E5E5`, table header `#F0F0F0`.
- Brand: **primary orange `#FF8C00`** (buttons, active nav, focus rings, highlights), black for headings and the "Crew" half of the logo. Success green, danger red used only for status.
- Logo text: "Code" (orange) + "Crew" (black), bold.
- Clean, dense-but-airy business look: left sidebar (collapsible; bottom tab bar on mobile), top bar with user menu, cards with subtle borders (no heavy shadows), rounded-lg, 14px base font, tabular numbers for money.
- **Fully responsive** (phone first: I will use it on my phone to add ad expenses quickly). Large tap targets, quick-add expense floating button on mobile.
- Empty states with a clear primary action, confirm dialogs for destructive actions, keyboard-friendly forms, accessible (labels, focus states, aria).
- Status badges with colors; money right-aligned; dates formatted `15 Oct 2026`.

## 9. DELIVERABLES (all in full, ready to run)

1. Complete project file tree and **every file's full code** (config files included: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig`, `index.html`, `vercel.json`, `.env.example`).
2. `supabase/schema.sql`, `supabase/seed.sql`, and the Edge Function `create-member`.
3. `README.md` with exact steps: create Supabase project → run SQL → deploy edge function → set env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, service role only in the Edge Function secrets) → create first admin → run locally → deploy to Vercel.
4. Zero placeholder code. The app must compile with `npm run build` with no TypeScript errors, and every screen above must be functional.

## 10. QUALITY CHECKLIST (verify before finishing)

- [ ] No stock/inventory anywhere; no extra features beyond this spec
- [ ] Project price 
saves as income; expenses date-wise per project; profit computed in SQL
- [ ] Invoice/quotation PDF matches my template layout and colors; numbers sequential per year
- [ ] WhatsApp send works through `wa.me` with the number normalized to `+94787970764` and a shareable link
- [ ] Admin can add members and assign projects; RLS enforces it at the database level
- [ ] Mobile layout works; lazy loading and pagination in place
- [ ] Service role key is never exposed to the frontend

Now build the entire system in one go.


git repo you can push public access i give first commit and push all most done - (https://github.com/RusiruPramod/Erp.git)