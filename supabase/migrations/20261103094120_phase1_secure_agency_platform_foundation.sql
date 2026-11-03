-- Phase 1: secure agency platform foundation (additive; preserves existing records)
alter table public.client_projects add column if not exists client_id uuid references public.clients(id) on delete set null;
alter table public.invoices add column if not exists client_id uuid references public.clients(id) on delete set null;
alter table public.client_approvals add column if not exists client_id uuid references public.clients(id) on delete set null;
alter table public.client_approvals add column if not exists project_id uuid references public.client_projects(id) on delete set null;

create table if not exists public.cc_client_users (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 user_id uuid not null unique references auth.users(id) on delete cascade,
 email text,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null,
 unique(client_id,user_id)
);
create table if not exists public.cc_campaigns (
 id uuid primary key default gen_random_uuid(), client_id uuid references public.clients(id) on delete set null,
 name text not null, channel text not null default 'Other', objective text,
 budget numeric(12,2) not null default 0 check(budget>=0), spend numeric(12,2) not null default 0 check(spend>=0),
 leads integer not null default 0 check(leads>=0), conversions integer not null default 0 check(conversions>=0),
 attributed_revenue numeric(12,2) not null default 0 check(attributed_revenue>=0),
 start_date date, end_date date, status text not null default 'Planning' check(status in ('Planning','Active','Paused','Completed')),
 notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cc_social_posts (
 id uuid primary key default gen_random_uuid(), client_id uuid references public.clients(id) on delete set null,
 campaign_id uuid references public.cc_campaigns(id) on delete set null, title text not null,
 platform text not null default 'Instagram' check(platform in ('Instagram','Facebook','YouTube','LinkedIn','X','Other')),
 format text not null default 'Post' check(format in ('Post','Story','Reel','Short','Video','Carousel','Other')),
 caption text, hashtags text, asset_url text, scheduled_at timestamptz,
 status text not null default 'Draft' check(status in ('Draft','Needs Approval','Approved','Scheduled','Published','Cancelled')),
 published_url text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cc_client_updates (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 project_id uuid references public.client_projects(id) on delete set null, title text not null, body text,
 update_type text not null default 'Progress' check(update_type in ('Progress','Milestone','File','Announcement')),
 is_visible_to_client boolean not null default true, created_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null
);
create table if not exists public.cc_asset_folders (
 id uuid primary key default gen_random_uuid(), client_id uuid references public.clients(id) on delete cascade,
 folder_name text not null, parent_id uuid references public.cc_asset_folders(id) on delete cascade,
 created_at timestamptz not null default now(), unique(client_id,folder_name,parent_id)
);
create index if not exists cc_client_users_user_id_idx on public.cc_client_users(user_id);
create index if not exists cc_client_users_client_id_idx on public.cc_client_users(client_id);
create index if not exists cc_campaigns_client_id_idx on public.cc_campaigns(client_id);
create index if not exists cc_campaigns_dates_idx on public.cc_campaigns(start_date,end_date);
create index if not exists cc_social_posts_schedule_idx on public.cc_social_posts(scheduled_at);
create index if not exists cc_social_posts_client_id_idx on public.cc_social_posts(client_id);
create index if not exists cc_client_updates_client_date_idx on public.cc_client_updates(client_id,created_at desc);
create index if not exists client_projects_client_id_idx on public.client_projects(client_id);
create index if not exists invoices_client_id_idx on public.invoices(client_id);
create index if not exists client_approvals_client_id_idx on public.client_approvals(client_id);
alter table public.cc_client_users enable row level security;
alter table public.cc_campaigns enable row level security;
alter table public.cc_social_posts enable row level security;
alter table public.cc_client_updates enable row level security;
alter table public.cc_asset_folders enable row level security;
create policy "Admins manage client user links" on public.cc_client_users for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "Clients read own active link" on public.cc_client_users for select to authenticated
using (user_id=(select auth.uid()) and is_active=true);
create policy "Admins manage campaigns" on public.cc_campaigns for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "Admins manage social posts" on public.cc_social_posts for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "Admins manage client updates" on public.cc_client_updates for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "Clients read visible updates" on public.cc_client_updates for select to authenticated
using (is_visible_to_client=true and exists(select 1 from public.cc_client_users cu where cu.user_id=(select auth.uid()) and cu.client_id=cc_client_updates.client_id and cu.is_active=true));
create policy "Admins manage asset folders" on public.cc_asset_folders for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "Linked clients read own projects" on public.client_projects for select to authenticated
using (client_id is not null and exists(select 1 from public.cc_client_users cu where cu.user_id=(select auth.uid()) and cu.client_id=client_projects.client_id and cu.is_active=true));
create policy "Linked clients read own invoices" on public.invoices for select to authenticated
using (client_id is not null and exists(select 1 from public.cc_client_users cu where cu.user_id=(select auth.uid()) and cu.client_id=invoices.client_id and cu.is_active=true));
create policy "Linked clients read own approvals" on public.client_approvals for select to authenticated
using (client_id is not null and exists(select 1 from public.cc_client_users cu where cu.user_id=(select auth.uid()) and cu.client_id=client_approvals.client_id and cu.is_active=true));
