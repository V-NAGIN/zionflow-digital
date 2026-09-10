-- Apply to the chosen Supabase project's SQL editor only after review.
-- All writes pass through the authenticated server; clients cannot grant access.
create table if not exists public.workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}',
  assessment jsonb,
  tasks jsonb not null default '[]'
);
alter table public.workspaces enable row level security;
revoke all on public.workspaces from anon, authenticated;
-- Atomic update prevents concurrent task changes from overwriting each other.
create or replace function public.set_task_completed(account_id uuid,task_id text,done boolean)
returns void language sql security invoker set search_path = public as $$
  update public.workspaces set tasks = (
    select coalesce(jsonb_agg(case when task->>'id'=task_id
      then jsonb_set(task,'{completed}',to_jsonb(done)) else task end order by ordinal),'[]'::jsonb)
    from jsonb_array_elements(tasks) with ordinality as t(task,ordinal)
  ) where user_id=account_id;
$$;
revoke all on function public.set_task_completed(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.set_task_completed(uuid,text,boolean) to service_role;

-- A paid order gives one calendar month. Re-delivery cannot extend it.
-- This adapter must remain disabled until the Shopify app's real renewal orders,
-- timestamps, currency, variant and refund payloads have passed a sandbox test.
create table if not exists public.billing_orders (
  order_id text primary key,
  customer_email text not null,
  paid_at timestamptz not null,
  paid_until timestamptz not null,
  revoked boolean not null default false
);
create table if not exists public.billing_revocations (
  order_id text primary key
);
alter table public.billing_orders enable row level security;
alter table public.billing_revocations enable row level security;
revoke all on public.billing_orders,public.billing_revocations from anon,authenticated;
create or replace function public.record_paid_order(order_id text,customer_email text,paid_at timestamptz,paid_until timestamptz)
returns void language sql security invoker set search_path=public as $$
 insert into public.billing_orders(order_id,customer_email,paid_at,paid_until,revoked)
 values($1,lower($2),$3,$4,exists(select 1 from public.billing_revocations r where r.order_id=$1))
 on conflict(order_id) do nothing;
$$;
create or replace function public.revoke_paid_order(refunded_order_id text)
returns void language plpgsql security invoker set search_path=public as $$
begin
 insert into public.billing_revocations(order_id) values(refunded_order_id) on conflict do nothing;
 update public.billing_orders set revoked=true where order_id=refunded_order_id;
end;
$$;
-- Caller supplies only an identity already verified by the auth provider.
-- Email is read from auth.users, never from the browser or request body.
create or replace function public.current_membership(account_id uuid)
returns table(plan text,status text,paid_until timestamptz)
language sql security definer set search_path=public,auth as $$
 select 'pro'::text,'active'::text,max(b.paid_until)
 from public.billing_orders b join auth.users u on lower(u.email)=b.customer_email
 where u.id=account_id and u.email_confirmed_at is not null
 and not b.revoked and not exists(select 1 from public.billing_revocations r where r.order_id=b.order_id)
 and b.paid_until>now()
 having max(b.paid_until) is not null;
$$;
revoke all on function public.record_paid_order(text,text,timestamptz,timestamptz) from public,anon,authenticated;
revoke all on function public.revoke_paid_order(text) from public,anon,authenticated;
revoke all on function public.current_membership(uuid) from public,anon,authenticated;
grant execute on function public.record_paid_order(text,text,timestamptz,timestamptz) to service_role;
grant execute on function public.revoke_paid_order(text) to service_role;
grant execute on function public.current_membership(uuid) to service_role;

create table if not exists public.ai_request_limits (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null,
 request_count integer not null
);
alter table public.ai_request_limits enable row level security;
revoke all on public.ai_request_limits from anon,authenticated;
create or replace function public.consume_ai_request(account_id uuid)
returns boolean language plpgsql security invoker set search_path=public as $$
declare count_now integer;
begin
 insert into public.ai_request_limits(user_id,window_start,request_count) values(account_id,date_trunc('minute',now()),1)
 on conflict(user_id) do update set
 request_count=case when ai_request_limits.window_start=date_trunc('minute',now()) then ai_request_limits.request_count+1 else 1 end,
 window_start=date_trunc('minute',now())
 returning request_count into count_now;
 return count_now<=12;
end;
$$;
revoke all on function public.consume_ai_request(uuid) from public,anon,authenticated;
grant execute on function public.consume_ai_request(uuid) to service_role;

-- Explicit privileges are required when automatic Data API exposure is disabled.
-- Browser roles remain denied by both grants and RLS (no permissive policies).
grant usage on schema public to service_role;
grant select,insert,update on public.workspaces,public.billing_orders,public.billing_revocations,public.ai_request_limits to service_role;
notify pgrst, 'reload schema';
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
