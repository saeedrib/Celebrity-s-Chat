-- BY CLICK rewards schema (review and apply only to the dedicated BY CLICK Supabase project).
-- This migration intentionally uses BY CLICK-prefixed tables and does not touch legacy chat tables.

create extension if not exists pgcrypto;

create table if not exists public.by_click_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  referral_code text not null unique,
  referred_by uuid references public.by_click_profiles(user_id),
  created_at timestamptz not null default now()
);

create table if not exists public.by_click_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null check (points <> 0),
  entry_type text not null check (entry_type in ('welcome','tap','referral_milestone','withdrawal','admin_adjustment')),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists by_click_ledger_user_date_idx on public.by_click_ledger(user_id, created_at desc);

create table if not exists public.by_click_referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','qualified','rejected')),
  qualified_at timestamptz,
  created_at timestamptz not null default now(),
  check (inviter_id <> invitee_id)
);

create table if not exists public.by_click_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null check (points >= 5000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  payout_details jsonb not null default '{}'::jsonb,
  admin_note text not null default '',
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create or replace function public.by_click_is_admin()
returns boolean language sql stable security invoker
set search_path = ''
as $$
  select coalesce((select (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'), false);
$$;

create or replace function public.by_click_create_member()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
  v_inviter uuid;
  v_input_code text;
begin
  v_code := upper(substr(encode(gen_random_bytes(8),'hex'),1,10));
  insert into public.by_click_profiles(user_id, full_name, referral_code)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name',''), v_code);

  insert into public.by_click_ledger(user_id, points, entry_type, note)
  values (new.id, 15, 'welcome', 'BY CLICK welcome bonus');

  v_input_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'referral_code_used','')));
  if v_input_code <> '' then
    select user_id into v_inviter from public.by_click_profiles
    where referral_code = v_input_code and user_id <> new.id;
    if v_inviter is not null then
      update public.by_click_profiles set referred_by = v_inviter where user_id = new.id;
      insert into public.by_click_referrals(inviter_id, invitee_id)
      values (v_inviter, new.id)
      on conflict (invitee_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists by_click_auth_user_created on auth.users;
create trigger by_click_auth_user_created
after insert on auth.users
for each row execute function public.by_click_create_member();

create or replace function public.by_click_tap()
returns jsonb language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_today integer;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  perform pg_advisory_xact_lock(hashtext(v_user::text));
  select coalesce(sum(points),0) into v_today
  from public.by_click_ledger
  where user_id=v_user and entry_type='tap'
    and created_at >= date_trunc('day', now())
    and created_at < date_trunc('day', now()) + interval '1 day';
  if v_today >= 1200 then raise exception 'Daily Tap & Earn limit reached'; end if;
  insert into public.by_click_ledger(user_id,points,entry_type,note)
  values(v_user,2,'tap','Tap & Earn');
  return jsonb_build_object('awarded',2,'daily_points',v_today+2,'daily_limit',1200);
end;
$$;

create or replace function public.by_click_request_withdrawal(p_points integer, p_payout_details jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_balance integer;
  v_id uuid;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  if p_points < 5000 then raise exception 'Minimum withdrawal is 5,000 points'; end if;
  perform pg_advisory_xact_lock(hashtext(v_user::text));
  select coalesce(sum(points),0) into v_balance from public.by_click_ledger where user_id=v_user;
  if exists(select 1 from public.by_click_withdrawals where user_id=v_user and status='pending') then
    raise exception 'You already have a pending withdrawal request';
  end if;
  if v_balance < p_points then raise exception 'Insufficient points balance'; end if;
  insert into public.by_click_withdrawals(user_id,points,payout_details)
  values(v_user,p_points,coalesce(p_payout_details,'{}'::jsonb)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.by_click_review_withdrawal(p_withdrawal_id uuid, p_approve boolean, p_note text default '')
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.by_click_withdrawals%rowtype;
  v_balance integer;
begin
  if not public.by_click_is_admin() then raise exception 'Admin access required'; end if;
  select * into v_row from public.by_click_withdrawals where id=p_withdrawal_id for update;
  if not found or v_row.status <> 'pending' then raise exception 'Pending request not found'; end if;
  if p_approve then
    select coalesce(sum(points),0) into v_balance from public.by_click_ledger where user_id=v_row.user_id;
    if v_balance < v_row.points then raise exception 'Member balance is no longer sufficient'; end if;
    insert into public.by_click_ledger(user_id,points,entry_type,note)
    values(v_row.user_id,-v_row.points,'withdrawal','Approved withdrawal '||v_row.id::text);
    update public.by_click_withdrawals set status='approved',admin_note=coalesce(p_note,''),reviewed_by=auth.uid(),reviewed_at=now() where id=v_row.id;
  else
    update public.by_click_withdrawals set status='rejected',admin_note=coalesce(p_note,''),reviewed_by=auth.uid(),reviewed_at=now() where id=v_row.id;
  end if;
end;
$$;

alter table public.by_click_profiles enable row level security;
alter table public.by_click_ledger enable row level security;
alter table public.by_click_referrals enable row level security;
alter table public.by_click_withdrawals enable row level security;

create policy "Members read own BY CLICK profile" on public.by_click_profiles
for select to authenticated using (user_id = (select auth.uid()) or public.by_click_is_admin());
create policy "Members update own basic BY CLICK profile" on public.by_click_profiles
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Members read own BY CLICK ledger" on public.by_click_ledger
for select to authenticated using (user_id = (select auth.uid()) or public.by_click_is_admin());
create policy "Members read own BY CLICK referrals" on public.by_click_referrals
for select to authenticated using (inviter_id = (select auth.uid()) or invitee_id = (select auth.uid()) or public.by_click_is_admin());
create policy "Members read own BY CLICK withdrawals" on public.by_click_withdrawals
for select to authenticated using (user_id = (select auth.uid()) or public.by_click_is_admin());

grant select, update on public.by_click_profiles to authenticated;
grant select on public.by_click_ledger, public.by_click_referrals, public.by_click_withdrawals to authenticated;
grant execute on function public.by_click_tap() to authenticated;
grant execute on function public.by_click_request_withdrawal(integer,jsonb) to authenticated;
grant execute on function public.by_click_review_withdrawal(uuid,boolean,text) to authenticated;

-- No client-side insert/update/delete grants on the points ledger or referral records.
