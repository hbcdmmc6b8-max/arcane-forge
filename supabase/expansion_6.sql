-- Arcane Forge expansion: server-backed prototypes for features 8,9,10,11,16,22.
-- Apply AFTER staff_roles.sql, moderation.sql and secure_chat.sql.
-- The server validates mutations. Combat itself is not server-authoritative.
create table if not exists public.af_exp_rooms(
 code text primary key check(code ~ '^[A-Z2-9]{6}$'),
 last_seen timestamptz not null default now()
);
create table if not exists public.af_exp_presence(
 room_code text not null references public.af_exp_rooms(code) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 last_seen timestamptz not null default now(),
 primary key(room_code,user_id)
);
create table if not exists public.af_exp_commands(
 id bigint generated always as identity primary key,
 room_code text not null references public.af_exp_rooms(code) on delete cascade,
 actor_id uuid not null references auth.users(id),
 action text not null check(action in ('announcement','heal','mana','respawn','freeze','unfreeze','spawn_bosses','clear_enemies','realm','event','stop_event')),
 target_id uuid references auth.users(id),
 payload text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists af_exp_commands_room_idx on public.af_exp_commands(room_code,id);
create table if not exists public.af_exp_guilds(
 id bigint generated always as identity primary key,
 name text not null unique check(char_length(name) between 3 and 32),
 owner_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.af_exp_members(
 user_id uuid primary key references auth.users(id),
 guild_id bigint not null references public.af_exp_guilds(id) on delete cascade
);
create table if not exists public.af_exp_inventory(
 user_id uuid not null references auth.users(id),
 spell text not null check(spell in ('Fire','Water','Wind','Earth','Lightning','Ice','Light','Shadow','Force')),
 amount integer not null default 0 check(amount between 0 and 100),
 primary key(user_id,spell)
);
create table if not exists public.af_exp_trades(
 id bigint generated always as identity primary key,
 seller uuid not null references auth.users(id),
 buyer uuid not null references auth.users(id),
 offered text not null,
 requested text not null,
 state text not null default 'open' check(state in ('open','accepted','cancelled')),
 created_at timestamptz not null default now(),
 check(seller<>buyer)
);
create table if not exists public.af_exp_duels(
 id bigint generated always as identity primary key,
 challenger uuid not null references auth.users(id),
 opponent uuid not null references auth.users(id),
 winner uuid references auth.users(id),
 state text not null default 'pending' check(state in ('pending','accepted','reported','finished','cancelled')),
 reported_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 check(challenger<>opponent)
);
create table if not exists public.af_exp_raids(
 room_code text primary key references public.af_exp_rooms(code) on delete cascade,
 hp integer not null check(hp between 0 and 10000),
 max_hp integer not null default 10000,
 active boolean not null default true,
 updated_at timestamptz not null default now()
);
create table if not exists public.af_exp_raid_hits(
 user_id uuid not null references auth.users(id),
 room_code text not null references public.af_exp_rooms(code),
 last_hit timestamptz not null default now(),
 primary key(user_id,room_code)
);
do $$
declare t text;
begin
 foreach t in array array['af_exp_rooms','af_exp_presence','af_exp_commands','af_exp_guilds','af_exp_members','af_exp_inventory','af_exp_trades','af_exp_duels','af_exp_raids','af_exp_raid_hits'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
create or replace function public.af_exp_heartbeat(room_code text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.af_room_allowed(room_code) then raise exception 'Room access denied' using errcode='42501'; end if;
 insert into public.af_exp_rooms(code) values(room_code) on conflict(code) do update set last_seen=now();
 insert into public.af_exp_presence(room_code,user_id) values(room_code,auth.uid())
 on conflict(room_code,user_id) do update set last_seen=now();
end $$;
create or replace function public.af_exp_rooms_list()
returns table(code text, players bigint) language plpgsql security definer set search_path='' as $$
begin
 if not coalesce(public.af_is_owner(),false) then raise exception 'Owner only' using errcode='42501'; end if;
 return query select r.code,count(p.user_id) from public.af_exp_rooms r
 left join public.af_exp_presence p on p.room_code=r.code and p.last_seen>now()-interval '90 seconds'
 where r.last_seen>now()-interval '3 minutes'
 group by r.code order by r.code limit 100;
end $$;
create or replace function public.af_exp_owner_command(room_code text, command_action text, command_payload text default '', target_user uuid default null)
returns bigint language plpgsql security definer set search_path='' as $$
declare cid bigint; qty integer;
begin
 if not coalesce(public.af_is_owner(),false) then raise exception 'Owner only' using errcode='42501'; end if;
 if room_code !~ '^[A-Z2-9]{6}$' or not exists(select 1 from public.af_exp_rooms where code=room_code and last_seen>now()-interval '3 minutes') then raise exception 'Inactive room'; end if;
 if command_action not in ('announcement','heal','mana','respawn','freeze','unfreeze','spawn_bosses','clear_enemies','realm','event','stop_event') then raise exception 'Invalid command'; end if;
 if char_length(coalesce(command_payload,''))>140 then raise exception 'Payload too long'; end if;
 if command_action='spawn_bosses' then
  if command_payload !~ '^[0-9]{1,2}$' then raise exception 'Boss count must be 1 to 20'; end if;
  qty:=command_payload::integer;
  if qty not between 1 and 20 then raise exception 'Boss count must be 1 to 20'; end if;
 end if;
 if command_action='realm' and command_payload not in ('Arcane','Ember','Glacier','Tempest','Verdant') then raise exception 'Invalid realm'; end if;
 if exists(select 1 from public.af_exp_commands where actor_id=auth.uid() and created_at>now()-interval '1 second') then raise exception 'Command cooldown'; end if;
 insert into public.af_exp_commands(room_code,actor_id,action,target_id,payload)
 values(room_code,auth.uid(),command_action,target_user,coalesce(command_payload,'')) returning id into cid;
 return cid;
end $$;
create or replace function public.af_exp_read_commands(room_code text, after_id bigint default 0)
returns table(id bigint,action text,target_id uuid,payload text)
language plpgsql security definer set search_path='' as $$
begin
 if not public.af_room_allowed(room_code) then raise exception 'Room access denied' using errcode='42501'; end if;
 return query select c.id,c.action,c.target_id,c.payload from public.af_exp_commands c
 where c.room_code=af_exp_read_commands.room_code and c.id>greatest(0,after_id)
 and c.created_at>now()-interval '3 minutes' order by c.id limit 40;
end $$;
create or replace function public.af_exp_guild_create(guild_name text)
returns bigint language plpgsql security definer set search_path='' as $$
declare gid bigint;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if char_length(trim(coalesce(guild_name,''))) not between 3 and 32 then raise exception 'Name must be 3-32 characters'; end if;
 if exists(select 1 from public.af_exp_members where user_id=auth.uid()) then raise exception 'Leave your guild first'; end if;
 insert into public.af_exp_guilds(name,owner_id) values(trim(guild_name),auth.uid()) returning id into gid;
 insert into public.af_exp_members(user_id,guild_id) values(auth.uid(),gid);
 return gid;
end $$;
create or replace function public.af_exp_guild_join(guild_name text)
returns void language plpgsql security definer set search_path='' as $$
declare gid bigint;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if exists(select 1 from public.af_exp_members where user_id=auth.uid()) then raise exception 'Already in a guild'; end if;
 select id into gid from public.af_exp_guilds where name=guild_name;
 if gid is null then raise exception 'Guild not found'; end if;
 insert into public.af_exp_members(user_id,guild_id) values(auth.uid(),gid);
end $$;
create or replace function public.af_exp_guild_leave()
returns void language plpgsql security definer set search_path='' as $$
declare gid bigint;
begin
 select guild_id into gid from public.af_exp_members where user_id=auth.uid();
 if gid is null then return; end if;
 if exists(select 1 from public.af_exp_guilds where id=gid and owner_id=auth.uid()) then
  delete from public.af_exp_members where guild_id=gid;
  delete from public.af_exp_guilds where id=gid;
 else delete from public.af_exp_members where user_id=auth.uid(); end if;
end $$;
create or replace function public.af_exp_guild_status()
returns table(name text,members bigint)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return query select g.name,count(m2.user_id) from public.af_exp_members m
 join public.af_exp_guilds g on g.id=m.guild_id
 join public.af_exp_members m2 on m2.guild_id=g.id
 where m.user_id=auth.uid() group by g.name;
end $$;
-- Trading uses server-issued demo tokens, not localStorage forged spell claims.
create or replace function public.af_exp_claim_starter()
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if exists(select 1 from public.af_exp_inventory where user_id=auth.uid()) then return; end if;
 insert into public.af_exp_inventory(user_id,spell,amount)
 select auth.uid(),x.spell,1 from unnest(array['Fire','Water','Wind','Earth','Lightning','Ice','Light','Shadow','Force']) as x(spell);
end $$;
create or replace function public.af_exp_inventory_list()
returns table(spell text,amount integer) language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return query select i.spell,i.amount from public.af_exp_inventory i where i.user_id=auth.uid() order by i.spell;
end $$;
create or replace function public.af_exp_trade_offer(buyer_id uuid, give_spell text, want_spell text)
returns bigint language plpgsql security definer set search_path='' as $$
declare tid bigint;
begin
 if auth.uid() is null or buyer_id is null or buyer_id=auth.uid() then raise exception 'Invalid buyer'; end if;
 if give_spell=want_spell or give_spell not in ('Fire','Water','Wind','Earth','Lightning','Ice','Light','Shadow','Force')
 or want_spell not in ('Fire','Water','Wind','Earth','Lightning','Ice','Light','Shadow','Force') then raise exception 'Invalid trade'; end if;
 if not exists(select 1 from public.af_exp_inventory where user_id=auth.uid() and spell=give_spell and amount>0) then raise exception 'Not owned'; end if;
 insert into public.af_exp_trades(seller,buyer,offered,requested) values(auth.uid(),buyer_id,give_spell,want_spell) returning id into tid;
 return tid;
end $$;
create or replace function public.af_exp_trade_accept(trade_id bigint)
returns void language plpgsql security definer set search_path='' as $$
declare t public.af_exp_trades%rowtype;
begin
 select * into t from public.af_exp_trades where id=trade_id for update;
 if t.id is null or t.state<>'open' or t.buyer<>auth.uid() then raise exception 'Trade unavailable'; end if;
 perform pg_advisory_xact_lock(hashtext(least(t.seller::text,t.buyer::text)));
 perform pg_advisory_xact_lock(hashtext(greatest(t.seller::text,t.buyer::text)));
 update public.af_exp_inventory set amount=amount-1 where user_id=t.seller and spell=t.offered and amount>0;
 if not found then raise exception 'Seller no longer owns token'; end if;
 update public.af_exp_inventory set amount=amount-1 where user_id=t.buyer and spell=t.requested and amount>0;
 if not found then raise exception 'Buyer does not own requested token'; end if;
 insert into public.af_exp_inventory(user_id,spell,amount) values(t.buyer,t.offered,1)
 on conflict(user_id,spell) do update set amount=public.af_exp_inventory.amount+1;
 insert into public.af_exp_inventory(user_id,spell,amount) values(t.seller,t.requested,1)
 on conflict(user_id,spell) do update set amount=public.af_exp_inventory.amount+1;
 update public.af_exp_trades set state='accepted' where id=t.id;
end $$;
create or replace function public.af_exp_trade_inbox()
returns table(id bigint,seller uuid,offered text,requested text)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return query select t.id,t.seller,t.offered,t.requested from public.af_exp_trades t
 where t.buyer=auth.uid() and t.state='open' order by t.id desc limit 30;
end $$;
-- Ranked match records are provisional: both players must agree on the winner.
-- This is not cheat-proof ELO matchmaking.
create or replace function public.af_exp_duel_challenge(opponent_id uuid)
returns bigint language plpgsql security definer set search_path='' as $$
declare did bigint;
begin
 if auth.uid() is null or opponent_id is null or opponent_id=auth.uid() then raise exception 'Invalid opponent'; end if;
 insert into public.af_exp_duels(challenger,opponent) values(auth.uid(),opponent_id) returning id into did;
 return did;
end $$;
create or replace function public.af_exp_duel_action(duel_id bigint, decision text, winner_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare d public.af_exp_duels%rowtype;
begin
 select * into d from public.af_exp_duels where id=duel_id for update;
 if d.id is null or auth.uid() not in (d.challenger,d.opponent) then raise exception 'Not a participant'; end if;
 if decision='accept' and d.state='pending' and auth.uid()=d.opponent then
  update public.af_exp_duels set state='accepted' where id=d.id;
 elsif decision='cancel' and d.state in ('pending','accepted') then
  update public.af_exp_duels set state='cancelled' where id=d.id;
 elsif decision='report' and d.state='accepted' and winner_id in (d.challenger,d.opponent) then
  update public.af_exp_duels set state='reported',winner=winner_id,reported_by=auth.uid() where id=d.id;
 elsif decision='confirm' and d.state='reported' and auth.uid()<>d.reported_by and winner_id=d.winner then
  update public.af_exp_duels set state='finished' where id=d.id;
 else raise exception 'Invalid duel transition'; end if;
end $$;
create or replace function public.af_exp_duel_list()
returns table(id bigint,challenger uuid,opponent uuid,state text,winner uuid,reported_by uuid)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 return query select d.id,d.challenger,d.opponent,d.state,d.winner,d.reported_by from public.af_exp_duels d
 where d.challenger=auth.uid() or d.opponent=auth.uid() order by d.id desc limit 30;
end $$;
create or replace function public.af_exp_raid_start(room_code text)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.af_exp_heartbeat(room_code);
 insert into public.af_exp_raids(room_code,hp,max_hp,active) values(room_code,10000,10000,true)
 on conflict(room_code) do update set hp=10000,active=true,updated_at=now()
 where public.af_exp_raids.active=false;
end $$;
create or replace function public.af_exp_raid_hit(room_code text)
returns integer language plpgsql security definer set search_path='' as $$
declare hp_left integer;
begin
 if not public.af_room_allowed(room_code) then raise exception 'Room access denied'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||room_code));
 if exists(select 1 from public.af_exp_raid_hits where user_id=auth.uid() and af_exp_raid_hits.room_code=af_exp_raid_hit.room_code and last_hit>now()-interval '2 seconds') then raise exception 'Raid attack cooldown'; end if;
 insert into public.af_exp_raid_hits(user_id,room_code) values(auth.uid(),room_code)
 on conflict(user_id,room_code) do update set last_hit=now();
 update public.af_exp_raids r set hp=greatest(0,hp-100),active=hp>100,updated_at=now()
 where r.room_code=af_exp_raid_hit.room_code and r.active=true returning r.hp into hp_left;
 if hp_left is null then raise exception 'No active raid'; end if;
 return hp_left;
end $$;
create or replace function public.af_exp_raid_status(room_code text)
returns table(hp integer,max_hp integer,active boolean)
language plpgsql security definer set search_path='' as $$
begin
 if not public.af_room_allowed(room_code) then raise exception 'Room access denied'; end if;
 return query select r.hp,r.max_hp,r.active from public.af_exp_raids r where r.room_code=af_exp_raid_status.room_code;
end $$;
create or replace function public.af_exp_staff_audit()
returns table(actor_id uuid,target_id uuid,action text,reason text,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if public.af_my_staff_role() not in ('owner','admin','mod') then raise exception 'Staff only' using errcode='42501'; end if;
 return query select a.actor_id,a.target_id,a.action,a.reason,a.created_at
 from public.af_moderation_actions a order by a.created_at desc limit 50;
end $$;
do $$
declare f record;
begin
 for f in select p.oid::regprocedure::text as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname like 'af_exp_%' loop
  execute 'revoke all on function '||f.signature||' from public,anon';
  execute 'grant execute on function '||f.signature||' to authenticated';
 end loop;
end $$;
