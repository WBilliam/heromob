Stage 3 - Developer Mode Prompt

Goal
Add a hidden developer-only mode for building enemy layouts per stage, and wire those layouts into gameplay.

References
- instruction docs/battlefield.md for stage flow and enemy placement context
- instruction docs/stages/stage 2.md for the current battle prototype baseline

Tech constraints
- Use Vue with HTML, CSS, and JavaScript.
- Reuse existing components and the shared battle-state module/composable.

Dev mode access
- Dev mode is hidden from normal players.
- Provide a secret unlock path (keyboard sequence, hidden click, etc).
- Route access should be blocked unless unlocked.

Dev mode tools
- Dev mode uses the same battlefield view as the game screen.
- The enemy placement zone is the top third of the battlefield.
- The developer can drag enemy buildings (nest, wall, tower) into the enemy zone.
- The developer can assign enemy creatures to enemy nests via drag-and-drop.
- Assigned creatures are shown on nests.
- Provide JSON export/import for stage layouts.
- Exported JSON should be loadable by the game (ex: `/stages/stage-config.json`).
- Provide stage selection for 3 stages (5 for boss battles).
- Allow a boss battle toggle that switches stage count between 3 and 5.
- Provide a "clear stage" action to wipe the current stage layout.

Stage progression
- Gameplay runs Stage 1 -> Stage 3 (or Stage 5 for bosses).
- When the enemy base is destroyed, advance to the next stage automatically.
- On stage advance, reset enemy base/units/structures to the configured layout.
- When the final stage is cleared, the player wins.

Out of scope (do not build yet)
- Persisting stage data to disk or a backend.
- Enemy AI for building placement.
- Obstacles and elemental stage effects.

Deliverable
A working dev mode that creates enemy stage layouts, assigns enemy spawns, and feeds stage changes into gameplay.
