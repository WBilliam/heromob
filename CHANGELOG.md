Changelog

Stage 1 - Battle Prototype
- Two bases and two nests with HP, spawn bars, and auto-spawning creatures.
- Targeting priority: nearest enemy creature, then enemy nest, then enemy base.
- Combat with windup/cooldown, base damage, and win/lose states.
- Creatures separate slightly, die with a short delay, and can pass through destroyed buildings.
- Scrollable battlefield that starts focused on the player base.

Stage 2 - Building Placement Prototype
- Building placement UI with a player-only building zone and drag-and-drop nests.
- Multiple player nests can be placed; nests start spawning immediately once placed.
- Placement validation prevents overlaps and snaps to the nearest valid spot.
- Component-based Vue structure with shared battle-state module/composable.
- Added Vue Router with menu, game, and dev routes (hash-based).
- Menu screen includes Play and Dev Mode buttons; game/dev screens are separated.
- Battle loop starts on entering the game route and stops when leaving it.
- Darker UI theme, battle-map background art, and in-game icon assets.
- Enemy HP bars render in red and enemy base uses a circular presentation.
- Added player wall building with high HP to delay enemies.
- Added tower building that fires arrow projectiles at enemy creatures.
- Creatures now aggro enemies/buildings within a radius, otherwise target the enemy base.
- Building and creature configs live in per-type modules; global config removed.
- Destroyed buildings disappear from the battlefield and no longer block placement.
- Added creature panel with population counters and drag-to-assign nest spawning.
- Nests now spawn only after a unit creature is assigned from the creature panel.

Stage 3 - Developer Mode
- Hidden unlock for dev mode with a guarded dev route.
- Dev screen with stage selector, boss battle toggle, and clear stage action.
- Enemy placement tools with a top-third enemy zone and drag-to-place buildings.
- Drag-to-assign enemy creature spawns to enemy nests.
- Enemy layouts feed into gameplay, with stage advancement driven by per-stage enemy HP% thresholds.
- Final stage threshold is forced to 0; thresholds can be edited in dev mode.
- Stage advances keep the enemy base HP instead of resetting it.
- HUD shows current stage progress during battles.
- Added JSON export/import for enemy stage layouts, plus auto-load from `/stages/stage-config.json`.
- Added in-UI save for stage config JSON to `public/stages/stage-config.json`.
