-- ═══════════════════════════════════════════
-- Rəqəmsal Platformalar — Supabase Schema
-- ═══════════════════════════════════════════

-- 1. PLATFORMS
create table platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  color text default '#6366f1',
  logo_url text,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- 2. ADMIN TOKENS
create table admin_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  role text not null check (role in ('super_admin','platform_admin')),
  platform_id uuid references platforms(id) on delete set null,
  label text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. REPORT PERIODS
create table report_periods (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid references platforms(id) on delete cascade not null,
  period_label text not null,
  issue_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(platform_id, period_label)
);

-- 4. COMPLETED ITEMS
create table completed_items (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references report_periods(id) on delete cascade not null,
  text text not null,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- 5. PLANNED ITEMS
create table planned_items (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references report_periods(id) on delete cascade not null,
  text text not null,
  plan_type text not null check (plan_type in ('month','quarter','year')),
  order_index integer default 0,
  created_at timestamptz default now()
);

-- 6. STATISTICS / KPI
create table statistics (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references report_periods(id) on delete cascade not null,
  label text not null,
  value text not null,
  unit text,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- 7. ATTACHMENTS (screenshots)
create table attachments (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references report_periods(id) on delete cascade not null,
  file_url text not null,
  file_name text,
  file_type text default 'screenshot',
  created_at timestamptz default now()
);

-- 8. PUBLISHED REPORTS
create table published_reports (
  id uuid primary key default gen_random_uuid(),
  period_label text not null,
  report_data jsonb not null,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════

alter table platforms enable row level security;
alter table admin_tokens enable row level security;
alter table report_periods enable row level security;
alter table completed_items enable row level security;
alter table planned_items enable row level security;
alter table statistics enable row level security;
alter table attachments enable row level security;
alter table published_reports enable row level security;

-- Public read for published_reports and platforms
create policy "public read platforms" on platforms for select using (true);
create policy "public read published" on published_reports for select using (true);

-- All operations allowed via anon key (token validation is done in app)
create policy "anon all platforms" on platforms for all using (true) with check (true);
create policy "anon all tokens" on admin_tokens for all using (true) with check (true);
create policy "anon all periods" on report_periods for all using (true) with check (true);
create policy "anon all completed" on completed_items for all using (true) with check (true);
create policy "anon all planned" on planned_items for all using (true) with check (true);
create policy "anon all stats" on statistics for all using (true) with check (true);
create policy "anon all attachments" on attachments for all using (true) with check (true);
create policy "anon all published" on published_reports for all using (true) with check (true);

-- ═══════════════════════════════════════════
-- STORAGE BUCKET
-- ═══════════════════════════════════════════
-- Run this in Supabase Dashboard → Storage → New bucket
-- Name: platform-assets
-- Public: true

-- ═══════════════════════════════════════════
-- SEED: Initial Super Admin Token
-- ═══════════════════════════════════════════
-- After setup, run this to create your first super admin link:
-- INSERT INTO admin_tokens (token, role, label)
-- VALUES ('superadmin-change-this-token', 'super_admin', 'Super Admin');
-- Then access: https://your-site.netlify.app/admin?token=superadmin-change-this-token
