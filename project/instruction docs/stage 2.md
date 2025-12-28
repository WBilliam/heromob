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
- Continue to use config.js for gameplay tuning where useful.

Battlefield zones
- The battle map is divided into three horizontal zones of equal height.
- The bottom third is the player building zone.
- The building zone starts slightly above the player base (leave a small gap).
- Visualize the building zone with a low-opacity vertical dashed boundary.
- The player cannot place buildings outside their building zone.
- On load, the camera should start focused on the player base.

Buildings UI area
- Add a left-side UI panel that lists the player's available buildings.
- For Stage 2, only one building type is needed: the nest.
- Each building entry is draggable.
- When a building is dropped inside the building zone, it becomes active on the battlefield.
- If the building is dropped outside the building zone, it snaps back to the UI panel.

Placement behavior
- The player can place multiple buildings if the design allows (keep it simple).
- Once placed, a building's functionality begins immediately.
- Example: a placed nest starts its spawn timer and begins spawning creatures.
- Buildings should remain interactable targets for combat using existing Stage 1 rules.
- Prevent buildings from overlapping each other or existing bases/nests.
- If the player drops a building on an invalid spot, it should snap to the nearest valid position inside the building zone (or fail placement if none exists).

Visuals and UI
- Use a darker, eye-friendly color palette for the HUD, panels, and overlays.
- Replace placeholder visuals with art assets (player base, enemy base, nest, goblin).
- The battlefield background should use a battle-map image instead of a flat gradient.
- Enemy creature and enemy building HP bars should render in red.
- Enemy base should be a circular base to match player base styling.

Out of scope (do not build yet)
- Enemy building placement or AI building logic.
- Building upgrades, costs, or limits.
- More building types beyond the nest.
- Complex placement validation, rotation, or grid snapping.

Deliverable
A working battle page that preserves Stage 1 combat and adds a simple building placement UI with a visible building zone, drag-and-drop placement, darker UI, and updated art.
