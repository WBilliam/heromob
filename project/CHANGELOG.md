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
- Darker UI theme, battle-map background art, and in-game icon assets.
- Enemy HP bars render in red and enemy base uses a circular presentation.
