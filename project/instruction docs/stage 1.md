Stage 1 - Battle Prototype Prompt

Goal
Build the first playable battle prototype using Vue. The result is a simple fight-battle page with two bases, two nests, auto-spawning creatures, basic targeting, and win/lose conditions, plus a small config file for tuning values.

References
- instruction docs/architecture.md for tech constraints and project structure ideas
- instruction docs/Instructions.md for future systems (do not implement yet)
- instruction docs/epic_war_saga_research.md for lane-based inspiration (use only as visual and gameplay reference)
- instruction docs/hub.md for future menus (out of scope for Stage 1)

Tech constraints
- Use Vue with HTML, CSS, and JavaScript.
- Keep structure simple and component-based.
- Use a simple config file for gameplay tuning.

Battlefield layout
- Top of screen: enemy base (large rectangle).
- Bottom of screen: player base.
- Player nest sits just above the player base.
- Enemy nest sits just below the enemy base.
- Battlefield is tall on the Y axis and scrollable.
- Start the camera focused on the player base.

Spawning
- Each nest spawns a creature on a timer.
- Use a 3 second spawn timer for now.
- When the timer completes, a new creature appears and starts moving immediately.
- Nests have HP and show a spawn progress bar.
- Destroyed nests stop spawning and reset their spawn progress.

Creature behavior
- If any enemy creatures are alive (and creature combat is enabled), target the nearest enemy creature.
- Otherwise, target the enemy nest if it is still alive.
- If the enemy nest is destroyed, target the enemy base.
- Recalculate target as needed when enemies appear or die.
- Creatures cannot pass through bases or nests while those buildings have HP.
- Once a base or nest reaches 0 HP, creatures can walk through it.
- Creatures show an HP bar.
- On death, keep the creature visible for a short delay before removing it.
- Add mild separation so creatures do not stack on top of each other.

Combat and win/lose rules
- Bases have hit points.
- When a creature contacts a base, the base HP is reduced.
- If a base reaches 0 HP, the game ends.
- Player wins if the enemy base reaches 0 first, otherwise the player loses.
- Creature attacks have a short windup delay before damage applies and a short cooldown after.

Out of scope (do not build yet)
- Hero units, spells, upgrades, menus, or meta systems.
- Additional buildings beyond nests.
- Full art or audio pipeline.

Deliverable
A working battle page that demonstrates spawning, movement, targeting, creature combat, base damage, and victory/defeat logic.
