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
- [ ] 8. Ranked duels: matchmaking, results, ranks and anti-cheat
- [ ] 9. Guilds: membership, invites and headquarters
- [ ] 10. Spell trading: atomic transactions and ownership checks
- [ ] 11. Cooperative boss raids: synchronized authoritative state
- [x] 12. Spectator mode: permissions and replay

## Owner and staff tools
- [x] 13. Live event creator: server-managed event lifecycle
- [x] 14. Custom boss builder: validated templates and encounters
- [x] 15. Server announcements: authenticated owner broadcast
- [ ] 16. Staff dashboard: reports, audit history and permission checks

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
