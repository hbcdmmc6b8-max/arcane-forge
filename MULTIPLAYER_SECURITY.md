# Arcane Forge multiplayer security deployment

The browser uses authenticated **private** Realtime topics `arcane-forge-private:ROOMCODE` for gameplay and database RPCs for chat. No service-role key belongs in browser code.

## Required migration order

1. `supabase/staff_roles.sql`
2. `supabase/moderation.sql`
3. `supabase/secure_chat.sql`
4. `supabase/private_rooms.sql`

Run these in your Supabase SQL Editor as a trusted database administrator. Do not put a database password or service-role key in GitHub or game JavaScript.

## Supabase configuration

- Enable authentication and verify users can sign in before joining a room.
- Enable Realtime Authorization and private channels.
- Audit existing policies on `realtime.messages`. Broad permissive policies may override the new restrictions.
- Disable public broadcast access for production if no other game features require it. The old `arcane-forge:CODE` topic is not protected by these policies.
- Verify the authenticated role can execute `af_room_allowed`, `af_send_room_message`, `af_read_room_messages`, and the staff moderation functions.

## Manual verification

1. Signed-out user attempts room join: must fail.
2. Signed-in ordinary player joins private room: must succeed.
3. Two authorized players exchange movement updates and chat.
4. Moderator mutes one account; that account's server-side chat send must fail.
5. Admin bans one account; its next room access check and chat RPC must fail.
6. Banned account attempts fresh private Realtime subscription: must fail.
7. Moderator attempts ban: server must reject.
8. Non-owner attempts staff assignment: server must reject.
9. Two clients test reconnects and token refresh; confirm denial after ban.
10. Inspect `realtime.messages` policies for permissive legacy grants.

## Security caveats

- Supabase private Realtime authorization validates access, **not gameplay movement payloads**. Malicious clients can still fabricate coordinates and combat state; authoritative gameplay requires a server simulation or trusted backend validating each action.
- A ban does not forcibly terminate an already-open socket immediately. The client checks room permission every 12 seconds, but modified clients can ignore client disconnect logic. For hard kick/ban guarantees, use a trusted room gateway that can revoke active connections, or move gameplay traffic behind server-side enforcement.
- Room codes are not a membership list. Any signed-in, unbanned account with a valid room code can join. For invite-only rooms, add server-side room ownership and membership tables.
- Room chat is currently polled every 1.6 seconds; this trades latency for straightforward server-checked reads. Add retention cleanup and database monitoring before high-volume production use.
- SQL migrations are committed, not applied automatically. Deploy and test before advertising moderation as fully enforced.
