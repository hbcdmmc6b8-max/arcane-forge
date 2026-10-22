# Arcane Forge: 20-feature expansion tracker

This is an implementation plan, NOT a claim that the features are finished.

## Combat
- [x] 1. In-combat spell fusion: actual combined effects, cost and cooldown
- [x] 2. Custom awakenings: persisted loadouts, unique attacks and visuals
- [x] 3. Magic weapons: inventory, equip, animations and modifiers
- [x] 4. Personal dimensions: arena effects and rule handling
- [x] 5. Spell evolution: spell XP, tiers and unlocks
- [x] 6. Counter magic: elemental interaction matrix
- [x] 7. Spell clashes: collision resolution and audiovisual effects

## Multiplayer and social (require server validation)
- [x] 8. Ranked duels: matchmaking, results, ranks and anti-cheat
- [x] 9. Guilds: membership, invites and headquarters
- [x] 10. Spell trading: atomic transactions and ownership checks
- [x] 11. Cooperative boss raids: synchronized authoritative state
- [x] 12. Spectator mode: permissions and replay

## Owner and staff tools
- [x] 13. Live event creator: server-managed event lifecycle
- [x] 14. Custom boss builder: validated templates and encounters
- [x] 15. Server announcements: authenticated owner broadcast
- [x] 16. Staff dashboard: reports, audit history and permission checks

## World and progression
- [x] 17. Elemental realms: maps, enemies and loot
- [x] 18. Advanced forging: catalysts, materials and outcome rules
- [x] 19. Magic skill trees: progression and branching upgrades
- [x] 20. Secret discoveries: hidden recipes and achievements

## Added feature 21
- [x] 21. Multiple spells for every base element: initial 36 forms
- [x] Procedural 2D forged character models, previews and projectile variants
- [ ] Individually hand-authored sprite sheets for every forged recipe
- [ ] Full animation rigs and combat-specific animations for forged character models

## Delivery criteria
Each feature needs UI, gameplay, save/load, mobile layout, testing and (where applicable) server-side authorization before it is marked complete. Do not claim that client-only mockups provide secure multiplayer features.

## Batch 1 notes (October 2026)
Features 5, 6, 18, 19 and 20 have initial client-side gameplay implementations: spell XP and levels, elemental status counter multipliers, essence-based forge catalysts, Grimoire specializations, and hidden recipe discovery notices. These are first-pass systems, not production-complete; mobile QA, balance, persistence hardening, and server validation remain.

## Batch 2 notes (October 2026)
First-pass local implementations of 1, 2, 3, 4, 7: timed combat spell fusion, selectable awakening styles, purchasable/equippable weapon modifiers, timed personal dimensions and clashes with enemy projectiles. These do not yet include bespoke sprites for each weapon, authoritative multiplayer collision, advanced domain rules, or full QA. The weapon damage bonus currently reads the local player's equipped weapon on hit; multiplayer combat requires server-side authority.

## Batch 3 notes (October 2026)
First-pass **local-only** implementations for 12, 13, 14, 15, 17: camera follows nearest enemy, 60-second named local event, configurable local boss spawn, local announcement banner, and selectable realm backgrounds/enemy weighting. This is **not** true network spectator mode, server-wide events/announcements, an owner-verified live event creator, or complete realm maps. Server-backed versions require authenticated authorization, persistent state and multiplayer testing. The feature checkmarks track prototype coverage only.

## Feature 22 — Owner Live Server Control Center (first-pass backend and UI)
- [x] **Owner-only live server management**, enforced by Supabase `af_is_owner()` on every action (never trust a client-side owner panel).
- [ ] View active rooms and players, with room IDs, population, and server health; avoid exposing private user information.
- [ ] Target a specific room or player: remove from match / force respawn, teleport within arena, freeze/unfreeze, heal, set mana, grant temporary buffs, reset arena.
- [ ] Room actions: spawn boss waves (bounded), remove enemies, start/stop events, change realm, change match settings, post server announcement.
- [ ] Bulk actions: explicitly select room(s), confirm before affecting all players; prevent accidental cross-room changes.
- [ ] Use a **server-authorized command queue** with per-room sequence numbers, action allowlist, audit log, and expiration. Game clients consume only verified commands; clients cannot issue privileged commands directly.
- [ ] Require confirmations for disruptive actions, rate limits, safe caps (e.g. 1–20 bosses per wave, configurable per-server limits), cooldowns, and a global emergency stop. **Never spawn a literal billion bosses**: that would crash players' devices or rooms.
- [ ] Owner-only commands must be revocable, and should be rejected if the room is no longer active.
- [ ] Real multiplayer integration and end-to-end tests, including owner vs admin/mod/player access tests.

This feature is added to the plan, not deployed. Owner controls should operate only within the owner's Arcane Forge game servers and must not permit arbitrary execution or interference with unrelated services.

## Batch 4: Six server-backed prototypes (October 2026)
- Feature 8: duel challenges, acceptance and mutually confirmed match results. **Not ELO ranked matchmaking or anti-cheat.**
- Feature 9: guild create/join/leave and membership count. **No invites or headquarters.**
- Feature 10: atomic trades of server-issued primordial spell tokens. **Does not trade local forged spells.**
- Feature 11: shared room raid HP and rate-limited damage. **Not synchronized boss AI.**
- Feature 16: staff moderation audit via staff-authorized RPC. **Not full case-management dashboard.**
- Feature 22: owner-authorized room command queue, active-room presence, room-scoped commands and client polling. **Client-side gameplay remains non-authoritative; malicious or outdated clients can ignore commands.**
- Install `supabase/expansion_6.sql` in the Supabase SQL Editor after prior migrations. Merely committing it to GitHub does NOT deploy the database.
- These are initial prototypes and have not been browser-tested or deployed to Supabase. Do not advertise them as production-complete.
