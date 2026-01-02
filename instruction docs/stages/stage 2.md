Stage 2 - Building Placement Prototype Prompt

Goal
Expand the Stage 1 battle prototype with building placement, a darker UI theme, and art-driven visuals. The player can drag a building from a UI panel and place it only inside their building zone, then fight using the existing combat rules.

References
- instruction docs/architecture.md for tech constraints and project structure ideas
- instruction docs/Instructions.md for future systems (do not implement yet)
- instruction docs/stage 1.md for the existing battle prototype baseline

Tech constraints
- Use Vue with HTML, CSS, and JavaScript.
- Prefer a component-based structure (split UI into components, keep battle logic in a shared module/composable).
- Gameplay tuning should live in per-building or per-creature modules.
- Use Vue Router to manage menu, game, and dev screens.

Battlefield zones
- The battle map is divided into three horizontal zones of equal height.
- The bottom third is the player building zone.
- The building zone starts slightly above the player base (leave a small gap).
- Visualize the building zone with a low-opacity vertical dashed boundary.
- The player cannot place buildings outside their building zone.
- On load, the camera should start focused on the player base.

Buildings UI area
- Add a left-side UI panel that lists the player's available buildings.
- For Stage 2, include nest, wall, and tower building types.
- Each building entry is draggable.
- When a building is dropped inside the building zone, it becomes active on the battlefield.
- If the building is dropped outside the building zone, it snaps back to the UI panel.

Creatures UI area
- Add a right-side UI panel that lists available creatures with a population counter (used/max).
- Creature entries are draggable and can be assigned to player nests.
- Only unit-level creatures can be assigned to nests.

Menu and navigation
- The menu screen is the default route and shows only two buttons: Play and Dev Mode.
- Play routes to the game screen and starts the battle loop.
- Dev Mode routes to a placeholder dev screen for enemy configuration (tools added later).
- Leaving the game screen should stop the battle loop.

Placement behavior
- The player can place multiple buildings if the design allows (keep it simple).
- Buildings become active immediately after placement, except nests.
- Nests only begin spawning after a unit creature is assigned via drag-and-drop.
- Walls act as high-HP barriers that slow enemy advance.
- Towers fire projectiles at enemy creatures within range.
- Buildings should remain interactable targets for combat using existing Stage 1 rules.
- When a building is destroyed, remove its graphic from the battlefield.
- Prevent buildings from overlapping each other or existing bases/nests.
- If the player drops a building on an invalid spot, it should snap to the nearest valid position inside the building zone (or fail placement if none exists).

Visuals and UI
- Use a darker, eye-friendly color palette for the HUD, panels, and overlays.
- Replace placeholder visuals with art assets (player base, enemy base, nest, goblin).
- The battlefield background should use a battle-map image instead of a flat gradient.
- Enemy creature and enemy building HP bars should render in red.
- Enemy base should be a circular base to match player base styling.
- Towers should show a visible HP bar, and arrows should render as projectiles.
- Creature targeting defaults to the enemy base, but if an enemy creature or building is within an aggro radius, they target it first.

Out of scope (do not build yet)
- Enemy building placement or AI building logic.
- Building upgrades, costs, or limits.
- More building types beyond the nest, wall, and tower.
- Complex placement validation, rotation, or grid snapping.
- The full enemy config toolset for dev mode.

Deliverable
A working battle page that preserves Stage 1 combat and adds a simple building placement UI with a visible building zone, drag-and-drop placement, darker UI, and updated art.
