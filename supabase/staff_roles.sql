-- Arcane Forge v2 staff roles. Run in Supabase SQL editor as database owner.
-- This migration requires the existing trusted af_is_owner() function.
create table if not exists public.af_staff_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('admin','mod')),
 assigned_by uuid not null references auth.users(id),
 assigned_at timestamptz not null default now()
);
alter table public.af_staff_roles enable row level security;
revoke all on public.af_staff_roles from anon, authenticated;
create or replace function public.af_set_staff_role(target_user uuid, new_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or coalesce(public.af_is_owner(),false) is not true then
  raise exception 'Owner permission required' using errcode='42501';
 end if;
 if target_user is null or new_role not in ('admin','mod','player') then
  raise exception 'Invalid role or user';
 end if;
 if target_user=auth.uid() then raise exception 'Cannot change owner role'; end if;
 if not exists(select 1 from auth.users where id=target_user) then
  raise exception 'Account not found';
 end if;
 if new_role='player' then
  delete from public.af_staff_roles where user_id=target_user;
 else
  insert into public.af_staff_roles(user_id,role,assigned_by)
  values(target_user,new_role,auth.uid())
  on conflict(user_id) do update set role=excluded.role,assigned_by=excluded.assigned_by,assigned_at=now();
 end if;
end $$;
create or replace function public.af_list_staff()
returns table(user_id uuid, role text)
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or coalesce(public.af_is_owner(),false) is not true then
  raise exception 'Owner permission required' using errcode='42501';
 end if;
 return query select r.user_id,r.role from public.af_staff_roles r order by r.assigned_at desc;
end $$;
create or replace function public.af_my_staff_role()
returns text language plpgsql security definer set search_path = '' as $$
declare assigned_role text;
begin
 if auth.uid() is null then return 'guest'; end if;
 if coalesce(public.af_is_owner(),false) then return 'owner'; end if;
 select r.role into assigned_role from public.af_staff_roles r where r.user_id=auth.uid();
 return coalesce(assigned_role,'player');
end $$;
revoke all on function public.af_set_staff_role(uuid,text) from public,anon;
revoke all on function public.af_list_staff() from public,anon;
revoke all on function public.af_my_staff_role() from public,anon;
grant execute on function public.af_set_staff_role(uuid,text) to authenticated;
grant execute on function public.af_list_staff() to authenticated;
grant execute on function public.af_my_staff_role() to authenticated;
-- Important: every future staff moderation RPC must separately verify
-- af_my_staff_role() server-side; role labels alone grant no powers.
