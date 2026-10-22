# Arcane Forge: 20-feature expansion tracker

This is an implementation plan, NOT a claim that the features are finished.

## Combat
- [ ] 1. In-combat spell fusion: actual combined effects, cost and cooldown
- [ ] 2. Custom awakenings: persisted loadouts, unique attacks and visuals
- [ ] 3. Magic weapons: inventory, equip, animations and modifiers
- [ ] 4. Personal dimensions: arena effects and rule handling
- [x] 5. Spell evolution: spell XP, tiers and unlocks
- [x] 6. Counter magic: elemental interaction matrix
- [ ] 7. Spell clashes: collision resolution and audiovisual effects

## Multiplayer and social (require server validation)
- [ ] 8. Ranked duels: matchmaking, results, ranks and anti-cheat
- [ ] 9. Guilds: membership, invites and headquarters
- [ ] 10. Spell trading: atomic transactions and ownership checks
- [ ] 11. Cooperative boss raids: synchronized authoritative state
- [ ] 12. Spectator mode: permissions and replay

## Owner and staff tools
- [ ] 13. Live event creator: server-managed event lifecycle
- [ ] 14. Custom boss builder: validated templates and encounters
- [ ] 15. Server announcements: authenticated owner broadcast
- [ ] 16. Staff dashboard: reports, audit history and permission checks

## World and progression
- [ ] 17. Elemental realms: maps, enemies and loot
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
