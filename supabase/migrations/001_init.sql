-- PHOTOBOOTH STUDIO schema. Run once in Supabase: SQL Editor -> paste -> Run.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  account_status text not null default 'active' check (account_status in ('active','suspended')),
  created_at timestamptz not null default now()
);
create table public.memberships (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free','standard','premium','lifetime')),
  updated_at timestamptz not null default now()
);
create table public.plans (tier text primary key check (tier in ('standard','premium','lifetime')), price int not null check (price > 0));
create table public.upgrade_prices (from_tier text not null, to_tier text not null, amount int not null check (amount > 0), primary key (from_tier, to_tier));
insert into public.plans values ('standard',10000),('premium',19000),('lifetime',49000);
insert into public.upgrade_prices values ('free','standard',10000),('free','premium',19000),('free','lifetime',49000),('standard','premium',10000),('standard','lifetime',40000),('premium','lifetime',30000);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  user_id uuid not null references auth.users(id),
  from_tier text not null, to_tier text not null,
  amount int not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','expired','cancelled')),
  snap_token text, redirect_url text, midtrans_transaction_id text, payment_type text,
  created_at timestamptz not null default now(), paid_at timestamptz
);
create unique index one_pending_per_target on public.transactions (user_id, to_tier) where status = 'pending';
create table public.membership_events (id bigint generated always as identity primary key, user_id uuid not null, from_tier text, to_tier text not null, reason text not null check (reason in ('purchase','admin')), order_id text, created_at timestamptz not null default now());
create table public.free_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, started_at timestamptz not null default now(), download_used boolean not null default false, finished_at timestamptz);
create index on public.free_sessions (user_id);
create table public.audit_logs (id bigint generated always as identity primary key, actor uuid, action text not null, target uuid, detail jsonb, created_at timestamptz not null default now());

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.plans enable row level security;
alter table public.upgrade_prices enable row level security;
alter table public.transactions enable row level security;
alter table public.membership_events enable row level security;
alter table public.free_sessions enable row level security;
alter table public.audit_logs enable row level security;  -- no policies: service role only
create policy "own profile" on public.profiles for select using (id = auth.uid());
create policy "own membership" on public.memberships for select using (user_id = auth.uid());
create policy "own transactions" on public.transactions for select using (user_id = auth.uid());
create policy "own events" on public.membership_events for select using (user_id = auth.uid());
create policy "own sessions" on public.free_sessions for select using (user_id = auth.uid());
create policy "public plans" on public.plans for select using (true);
create policy "public upgrade prices" on public.upgrade_prices for select using (true);
-- No insert/update/delete policies: clients cannot write. All writes go through the functions below or the service role.

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.memberships (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.rank_of(t text) returns int language sql immutable as $$
  select case t when 'free' then 0 when 'standard' then 1 when 'premium' then 2 when 'lifetime' then 3 else -1 end $$;

create function public.get_quota() returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t text; used int; act boolean;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select tier into t from memberships where user_id = uid;
  select count(*) into used from free_sessions where user_id = uid;
  select exists(select 1 from free_sessions where user_id = uid and finished_at is null and started_at > now() - interval '60 minutes') into act;
  return json_build_object('tier', coalesce(t,'free'), 'used', used, 'limit', 2, 'remaining', greatest(2 - used, 0), 'active', act);
end $$;

-- Starts a session. Resumes an open session (< 60 min, no download yet) without using quota, so refresh/re-login never costs a session.
create function public.start_session() returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t text; s record; used int; new_id uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from profiles where id = uid and account_status = 'active') then raise exception 'account suspended'; end if;
  select tier into t from memberships where user_id = uid;
  if t is distinct from 'free' then
    return json_build_object('allowed', true, 'session_id', null, 'remaining', null, 'download_used', false);
  end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select count(*) into used from free_sessions where user_id = uid;
  select * into s from free_sessions where user_id = uid and finished_at is null and started_at > now() - interval '60 minutes' order by started_at desc limit 1;
  if found then
    return json_build_object('allowed', true, 'session_id', s.id, 'remaining', greatest(2 - used, 0), 'download_used', s.download_used);
  end if;
  if used >= 2 then
    return json_build_object('allowed', false, 'session_id', null, 'remaining', 0, 'download_used', false);
  end if;
  insert into free_sessions (user_id) values (uid) returning id into new_id;
  return json_build_object('allowed', true, 'session_id', new_id, 'remaining', 2 - (used + 1), 'download_used', false);
end $$;

create function public.mark_download(p_session uuid) returns boolean language plpgsql security definer set search_path = public as $$
begin
  update free_sessions set download_used = true, finished_at = now()
   where id = p_session and user_id = auth.uid() and download_used = false;
  return found;
end $$;

-- Service-role only: called by the verified Midtrans webhook. Idempotent and never downgrades.
create function public.activate_membership(p_order text, p_txn text, p_type text) returns text language plpgsql security definer set search_path = public as $$
declare tx record; cur text;
begin
  update transactions set status = 'paid', paid_at = now(), midtrans_transaction_id = p_txn, payment_type = p_type
   where order_id = p_order and status in ('pending','expired') returning * into tx;
  if not found then return 'already_processed'; end if;
  select tier into cur from memberships where user_id = tx.user_id for update;
  if rank_of(tx.to_tier) > rank_of(cur) then
    update memberships set tier = tx.to_tier, updated_at = now() where user_id = tx.user_id;
    insert into membership_events (user_id, from_tier, to_tier, reason, order_id) values (tx.user_id, cur, tx.to_tier, 'purchase', p_order);
    return 'activated';
  end if;
  return 'no_upgrade';
end $$;

create function public.admin_stats() returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'users', (select count(*) from profiles),
    'free', (select count(*) from memberships where tier = 'free'),
    'standard', (select count(*) from memberships where tier = 'standard'),
    'premium', (select count(*) from memberships where tier = 'premium'),
    'lifetime', (select count(*) from memberships where tier = 'lifetime'),
    'transactions', (select count(*) from transactions),
    'paid', (select count(*) from transactions where status = 'paid'),
    'revenue', (select coalesce(sum(amount),0) from transactions where status = 'paid')) $$;

revoke all on function public.get_quota(), public.start_session(), public.mark_download(uuid), public.activate_membership(text,text,text), public.admin_stats(), public.handle_new_user() from public, anon, authenticated;
grant execute on function public.get_quota(), public.start_session(), public.mark_download(uuid) to authenticated;
grant execute on function public.activate_membership(text,text,text), public.admin_stats() to service_role;

-- To make yourself admin (after registering), run with your email:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
