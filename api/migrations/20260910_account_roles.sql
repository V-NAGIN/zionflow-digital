-- Assignments are managed by the database administrator, never by customers.
create table if not exists public.account_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','admin','customer')),
 created_at timestamptz not null default now()
);
alter table public.account_roles enable row level security;
revoke all on public.account_roles from public,anon,authenticated,service_role;
grant select on public.account_roles to service_role;
notify pgrst,'reload schema';
