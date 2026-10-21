-- Server-authorized Arcane Forge chat. Apply after staff_roles.sql and moderation.sql.
create table if not exists public.af_room_messages (
 id bigint generated always as identity primary key,
 room_code text not null check(room_code ~ '^[A-Z2-9]{6}$'),
 sender_id uuid not null references auth.users(id),
 sender_name text not null check(char_length(sender_name) between 1 and 24),
 body text not null check(char_length(body) between 1 and 160),
 created_at timestamptz not null default now()
);
create index if not exists af_room_messages_recent on public.af_room_messages(room_code,id desc);
alter table public.af_room_messages enable row level security;
revoke all on public.af_room_messages from anon,authenticated;
create or replace function public.af_room_allowed(room_code text)
returns boolean language plpgsql security definer set search_path='' as $$
declare banned boolean;
begin
 if auth.uid() is null or room_code !~ '^[A-Z2-9]{6}$' then return false; end if;
 select s.is_banned into banned from public.af_my_moderation_status() s;
 return not coalesce(banned,false);
end $$;
create or replace function public.af_send_room_message(room_code text, sender_name text, message_body text)
returns bigint language plpgsql security definer set search_path='' as $$
declare muted boolean; banned boolean; last_sent timestamptz; message_id bigint;
begin
 if not public.af_room_allowed(room_code) then raise exception 'Room access denied' using errcode='42501'; end if;
 select s.is_muted,s.is_banned into muted,banned from public.af_my_moderation_status() s;
 if coalesce(muted,false) or coalesce(banned,false) then raise exception 'Chat restricted' using errcode='42501'; end if;
 if sender_name is null or char_length(trim(sender_name)) not between 1 and 24
    or message_body is null or char_length(trim(message_body)) not between 1 and 160 then
   raise exception 'Invalid chat message';
 end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 select max(m.created_at) into last_sent from public.af_room_messages m where m.sender_id=auth.uid();
 if last_sent>now()-interval '2.5 seconds' then raise exception 'Chat rate limit'; end if;
 insert into public.af_room_messages(room_code,sender_id,sender_name,body)
 values(room_code,trim(sender_name),trim(message_body)) returning id into message_id;
 return message_id;
end $$;
create or replace function public.af_read_room_messages(room_code text, after_id bigint default 0)
returns table(id bigint,sender_id uuid,sender_name text,body text,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if not public.af_room_allowed(room_code) then raise exception 'Room access denied' using errcode='42501'; end if;
 return query select m.id,m.sender_id,m.sender_name,m.body,m.created_at
 from public.af_room_messages m where m.room_code=af_read_room_messages.room_code and m.id>greatest(0,after_id)
 order by m.id asc limit 50;
end $$;
revoke all on function public.af_room_allowed(text) from public,anon;
revoke all on function public.af_send_room_message(text,text,text) from public,anon;
revoke all on function public.af_read_room_messages(text,bigint) from public,anon;
grant execute on function public.af_room_allowed(text) to authenticated;
grant execute on function public.af_send_room_message(text,text,text) to authenticated;
grant execute on function public.af_read_room_messages(text,bigint) to authenticated;
-- Realtime gameplay broadcasts remain a separate, UNPROTECTED transport.
-- For authoritative game-room access, migrate player-state to private Realtime
-- channels with appropriate realtime.messages RLS policies.
