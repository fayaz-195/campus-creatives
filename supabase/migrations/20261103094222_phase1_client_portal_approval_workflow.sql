create table if not exists public.cc_approval_responses (
 id uuid primary key default gen_random_uuid(), approval_id uuid not null references public.client_approvals(id) on delete cascade,
 client_id uuid not null references public.clients(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
 decision text not null check(decision in ('Approved','Changes Requested')), feedback text, created_at timestamptz not null default now()
);
alter table public.cc_approval_responses enable row level security;
create policy "Admins manage approval responses" on public.cc_approval_responses for all to authenticated
using(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
with check(exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "Clients submit own approval responses" on public.cc_approval_responses for insert to authenticated
with check(user_id=(select auth.uid()) and exists(select 1 from public.cc_client_users cu where cu.user_id=(select auth.uid()) and cu.client_id=cc_approval_responses.client_id and cu.is_active=true) and exists(select 1 from public.client_approvals a where a.id=cc_approval_responses.approval_id and a.client_id=cc_approval_responses.client_id));
create policy "Clients read own approval responses" on public.cc_approval_responses for select to authenticated
using(user_id=(select auth.uid()) and exists(select 1 from public.cc_client_users cu where cu.user_id=(select auth.uid()) and cu.client_id=cc_approval_responses.client_id and cu.is_active=true));
create policy "Linked clients read own client record" on public.clients for select to authenticated
using(exists(select 1 from public.cc_client_users cu where cu.user_id=(select auth.uid()) and cu.client_id=clients.id and cu.is_active=true));
drop policy if exists "Linked clients respond to own approvals" on public.client_approvals;
create index if not exists cc_asset_folders_parent_id_idx on public.cc_asset_folders(parent_id);
create index if not exists cc_client_updates_project_id_idx on public.cc_client_updates(project_id);
create index if not exists cc_client_updates_created_by_idx on public.cc_client_updates(created_by);
create index if not exists cc_client_users_created_by_idx on public.cc_client_users(created_by);
create index if not exists cc_social_posts_campaign_id_idx on public.cc_social_posts(campaign_id);
create index if not exists client_approvals_project_id_idx on public.client_approvals(project_id);
create index if not exists cc_approval_responses_approval_id_idx on public.cc_approval_responses(approval_id);
create index if not exists cc_approval_responses_client_id_idx on public.cc_approval_responses(client_id);
create index if not exists cc_asset_folders_client_id_idx on public.cc_asset_folders(client_id);
create index if not exists cc_approval_responses_user_id_idx on public.cc_approval_responses(user_id);
