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
