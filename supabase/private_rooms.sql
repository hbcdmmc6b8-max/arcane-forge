-- Apply AFTER staff_roles.sql, moderation.sql, secure_chat.sql.
-- Supabase Dashboard > Realtime > Settings: disable public access where possible.
-- This protects the NEW private gameplay topic; old public topics remain reachable
-- until clients are migrated and public Realtime broadcast is disabled.
create or replace function public.af_realtime_room_authorized(topic text)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare room_code text;
begin
 if topic is null or topic !~ '^arcane-forge-private:[A-Z2-9]{6}$' then return false; end if;
 room_code:=split_part(topic,':',2);
 return public.af_room_allowed(room_code);
end $$;
revoke all on function public.af_realtime_room_authorized(text) from public,anon;
grant execute on function public.af_realtime_room_authorized(text) to authenticated;
-- Supabase Realtime Authorization evaluates RLS policies on realtime.messages
-- for private channel joins, receiving (SELECT) and sending (INSERT).
alter table realtime.messages enable row level security;
drop policy if exists "af_gameplay_private_read" on realtime.messages;
drop policy if exists "af_gameplay_private_send" on realtime.messages;
create policy "af_gameplay_private_read" on realtime.messages
 for select to authenticated using (
  realtime.topic() ~ '^arcane-forge-private:[A-Z2-9]{6}$'
  and public.af_realtime_room_authorized(realtime.topic())
 );
create policy "af_gameplay_private_send" on realtime.messages
 for insert to authenticated with check (
  realtime.topic() ~ '^arcane-forge-private:[A-Z2-9]{6}$'
  and public.af_realtime_room_authorized(realtime.topic())
 );
-- NOTE: Other existing realtime.messages policies may grant broader access.
-- Audit/remove permissive policies before calling this security-complete.
-- Revocation of an already-authorized WebSocket subscription is not instantaneous:
-- clients must periodically re-authorize, and high-assurance deployments should
-- terminate sessions using a trusted backend when bans occur.
