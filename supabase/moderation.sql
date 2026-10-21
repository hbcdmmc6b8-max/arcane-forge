-- Run AFTER supabase/staff_roles.sql. Server-checked staff moderation.
create table if not exists public.af_moderation_actions (
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 target_id uuid not null references auth.users(id),
 action text not null check(action in ('warn','mute','unmute','ban','unban')),
 reason text not null default '',
 expires_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists af_moderation_target_idx on public.af_moderation_actions(target_id,created_at desc);
alter table public.af_moderation_actions enable row level security;
revoke all on public.af_moderation_actions from anon,authenticated;
create or replace function public.af_moderate_player(target_user uuid, moderation_action text, moderation_reason text default '')
returns void language plpgsql security definer set search_path='' as $$
declare actor_role text; target_role text;
begin
 actor_role:=public.af_my_staff_role();
 if actor_role not in ('owner','admin','mod') then raise exception 'Staff permission required' using errcode='42501'; end if;
 if moderation_action not in ('warn','mute','unmute','ban','unban') then raise exception 'Unknown action'; end if;
 if moderation_action in ('ban','unban') and actor_role='mod' then raise exception 'Admin permission required' using errcode='42501'; end if;
 if target_user is null or target_user=auth.uid() then raise exception 'Invalid target'; end if;
 if not exists(select 1 from auth.users where id=target_user) then raise exception 'Account not found'; end if;
 if coalesce(moderation_reason,'')<>left(coalesce(moderation_reason,''),200) then raise exception 'Reason too long'; end if;
 select r.role into target_role from public.af_staff_roles r where r.user_id=target_user;
 if target_role is not null and actor_role<>'owner' then raise exception 'Only owner may moderate staff' using errcode='42501'; end if;
 insert into public.af_moderation_actions(actor_id,target_id,action,reason,expires_at)
 values(auth.uid(),target_user,moderation_action,coalesce(moderation_reason,''),case when moderation_action='mute' then now()+interval '1 hour' when moderation_action='ban' then now()+interval '1 day' else null end);
end $$;
create or replace function public.af_my_moderation_status()
returns table(is_muted boolean,is_banned boolean,warning_count bigint)
language sql security definer set search_path='' as $$
 with latest as (
  select distinct on (action_group) action,expires_at from (
   select case when action in ('mute','unmute') then 'mute' when action in ('ban','unban') then 'ban' else 'warn' end action_group,
   action,expires_at,created_at,id from public.af_moderation_actions
   where target_id=auth.uid()
  ) t order by action_group,created_at desc,id desc
 )
 select
  coalesce((select action='mute' and expires_at>now() from latest where action in ('mute','unmute')),false),
  coalesce((select action='ban' and expires_at>now() from latest where action in ('ban','unban')),false),
  (select count(*) from public.af_moderation_actions where target_id=auth.uid() and action='warn');
$$;
revoke all on function public.af_moderate_player(uuid,text,text) from public,anon;
revoke all on function public.af_my_moderation_status() from public,anon;
grant execute on function public.af_moderate_player(uuid,text,text) to authenticated;
grant execute on function public.af_my_moderation_status() to authenticated;
-- IMPORTANT: Client chat uses Supabase Realtime broadcast; client checks alone
-- cannot prevent a modified client from broadcasting. For authoritative mute/ban
-- enforcement, move room chat and room admission through a server-side endpoint
-- or Realtime authorization policies that consult moderation state.
