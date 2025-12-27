# Epic War Saga — Research & Reverse‑Template Notes (Flash Era)
the project is inspired by this game so use this inforamtion as reference if there is not information already on a subject
> Goal: capture **how Epic War Saga works** (mechanics, gameplay loop, progression, economy, UI/UX patterns, and art style) so you can build a **modern template** with similar feel.

**Game:** *Epic War Saga* (originally Flash; later relaunched on Kongregate)  
**Genre:** 2D side‑scrolling “tug‑of‑war” strategy / defense with RPG‑style progression and online features (arena/PvP).  
**Primary references used:** EpicWarSaga Wiki (Fandom), Kongregate listing & updates, Newgrounds entry, Epic War series wiki.

---

## 1) High-level concept

Epic War Saga plays like a **lane-based side-scrolling battle**:

- Two armies enter from opposite sides.
- You field **units** (summoned in squads) plus **one hero**.
- You push the fight toward the enemy side; battles are about **timing summons**, **spell usage**, and **composition**.
- Outside battle, you progress via a **meta layer**: leveling, allocating stats, collecting/crafting gear, unlocking/crafting units, and tackling increasingly difficult missions and special “trial” content.

**One-sentence loop:** *Farm quests → gain XP/loot/materials → improve hero + global player stats → improve army composition → compete in arena for battle points → spend battle points on high-challenge trials → repeat.*

Sources:  
- Newgrounds short description (“Online SideScroller Defense … quests and battle with other armies”).  
- Kongregate listing (relaunch details & update log).  
- Wiki pages on heroes/units/stats/arena/buildings.

---

## 2) Core combat gameplay (battle layer)

### 2.1 Battlefield & flow
- **2D side view**, horizontal lane. Camera can scroll along the stage.
- Your army spawns from your side; enemy spawns from the other.
- The player summons squads and casts hero spells to win by overpowering the enemy and/or completing mission victory conditions.

### 2.2 Unit summoning: the “summoning bar”
Epic War Saga uses a “summoning resource” (described as a **hero’s blue summoning bar**) that limits how frequently you can summon squads.

- Each unit has a **Cost to Summon** that consumes a portion of this bar.
- Units often spawn as **Population** (a squad size), not as a single entity.

From the Units category description: **Population** and **Cost to Summon** are explicit unit parameters.

### 2.3 Stats & scaling model (important)
A defining design choice is **global player stats** that apply across your roster:

- **Player Stats** increase via **skill points** (level-ups) and **equipment**.
- Player stats apply to **all units and heroes**, but each unit has an **Aptitude** (percentage) that determines how much of the player’s base stats are applied to that unit’s HP/Atk/Def.
- Units also gain stat increases on level-up based on **aptitude / 100**.

This creates a very “RPG account progression” feel: even low-tier units can scale if their aptitudes are good, but you still need composition/roles.

Wiki mechanics terminology:
- **Base Stat vs Adjusted Stat**
- **Attack Speed** (seconds between attacks; heroes have special rules: constant attack speed and may attack instantly if they have mana and aren’t in an animation)
- **Move Speed** (higher = faster)

### 2.4 Hero rules
- You can use **only one hero at a time**.
- If your **hero dies, you lose** the combat.
- Heroes are **immune to status effects**.
- Heroes have **1–5 spells** that consume **mana**.

This makes the hero both a commander and a “fail condition,” similar to a MOBA core-unit, encouraging defensive play, positioning, and spell timing.

### 2.5 Spells & mana
- Hero spells consume mana and can be used to swing fights.
- Because the wiki notes heroes can attack instantly while they have mana (subject to animation), there’s a strong implication that **mana gates your hero’s throughput**—both attacks and spells.

### 2.6 Difficulty modes and “trial” content
Epic War games commonly feature multiple difficulty modes (Normal/Hard/Epic in related entries), and Epic War Saga specifically has special “trial” missions:

- **Cave of Trials**: high-challenge missions that cost **Battle Points** (earned in the Arena) rather than energy/action.
- Trials have **100% drop rate** (per Arena page description of Cave of Trial fights).
- Winning a trial and leveling up after does **not** refill energy (per mechanics page).

This creates a clean split:
- **Energy/Action** → standard questing/farming loop  
- **Battle Points** → trial/boss loop

---

## 3) Meta progression (outside battle)

### 3.1 Leveling & stat allocation
- Player leveling grants points into core stats (noted on wiki and in community beginner advice).
- Because equipment contributes heavily early, “best stat build” is not purely from points—gear matters a lot.

### 3.2 Items: equipment, foodstuffs, materials
Items are grouped into:
- **Equipment**: permanent, boosts stats and grants special abilities.
- **Foodstuffs**: consumable “equip” items; lost after being used in battle once.
- **Materials**: no direct stats; used in crafting/buildings (Monster Lab, Blacksmith).

Equipment traits (from Equipment category):
- Stat modifications (HP/Atk/Def etc.)
- **Special abilities** with magnitudes marked like S/M/L (5%/10%/20%)
- Stacking rules exist (multiple items can stack specials).

### 3.3 Crafting buildings

#### Monster Lab (unit crafting)
Monster Lab is where you craft **new units** using:
- Ingredient materials + gold
- Often at least **one other unit** is required as part of the recipe
- Units consumed in recipes are **lost** and must be purchased again to use as ingredients again
- Upgrading Monster Lab unlocks additional recipes, but you **don’t see previews** of next-level recipes; they become visible only after upgrading
- There’s an alternative “Crystal Cost” that **skips ingredient and gold cost** (premium currency shortcut)

The Monster Lab page includes a long list of craftable units (e.g., Troll, Centaur Archer, Templar Knight, Holy Matriarch, Angel Knight, Phantom Beast, Fire Dragon, etc.)

#### Blacksmith (equipment crafting)
Blacksmith upgrades unlock recipes for weapons/armor/shields/etc.  
The Blacksmith page lists:
- Upgrade levels with **gold costs**
- New recipes unlocked per level  
(Examples include Excalibourne, Dragon King series, Epic Blade/Armour/Shield series, Ragnarok, Balmung, etc.)

This suggests a **tiered crafting ladder**:
- early “cool” recipes quickly,
- then long-term high-cost upgrades to reach endgame crafting.

### 3.4 Arena (asynchronous PvP + BP economy)
Arena is a major online pillar:

- You fight other players’ setups; opponents have an **Action** cost.
- If you lack action points, you can still **inspect opponents** and back out without spending action (action is deducted after closing win/lose screen).
- **Battle Points (BP)** are earned on wins and lost on defeats.
- BP is used to enter **Cave of Trial** fights.

This is a classic “PvP feeds PvE endgame” loop:
1) spend action in arena → 2) earn BP → 3) spend BP on trials → 4) earn guaranteed drops → 5) power up → back to arena.

---

## 4) UI/UX patterns & controls (template-relevant)

While the wiki focuses on systems, the Epic War series’ common control scheme is visible on Kongregate pages for related entries (e.g., Epic War 4) and is consistent with side-scrolling tug-of-war Flash design:

- Arrow keys: scroll camera  
- Hotkeys for unit slots and spells  
- Select-all shortcuts (A/S/D in Epic War 4)  
- Mouse-driven placement/selection is common (point-and-click + hotkeys)

**Template takeaway:** support both:
- “casual mouse play” and
- “expert hotkey play” for faster micro.

---

## 5) Art style & presentation

### 5.1 Visual style
Based on screenshots and the broader Epic War series:
- **2D illustrated sprites** with **high-contrast silhouettes**.
- Units and heroes are detailed and stylized (fantasy + occasional anachronistic/“fun” items like sci‑fi swords, mechs, etc., implied by item names such as “Light Saber Z”, “Galaxy Sword”, “War Tank”).
- Heavy use of **impactful VFX**: large spell bursts, elemental effects, screen-filling attacks.
- UI tends to be **metal/stone fantasy framing** with large bars (HP/mana/summon) and ability icons.

### 5.2 Tone & content mix
The content list implies a “rule-of-cool” blend:
- Traditional fantasy (knights, angels, dragons, golems)
- Pop-culture adjacent naming (e.g., “Light Saber”)
- Mythic/boss-tier entities (Arch Angel, Dark Knight, etc.)

This supports a broad unit roster with strong “collect them all” appeal.

---

## 6) What makes Epic War Saga feel distinct (design pillars)

1) **Single-hero fail condition**  
   Hero death = loss creates tension and gives defensive value.

2) **Roster-wide stat scaling via Aptitude**  
   Player stats apply to everything, scaled per unit/hero. This is a powerful long-term progression hook.

3) **Dual resource gates (Energy/Action vs BP)**  
   Regular play uses energy/action; “prestige” content uses BP from PvP.

4) **Crafting as progression, not just loot**  
   Monster Lab and Blacksmith unlock meaningful power and new unit archetypes.

5) **High unit count spectacle**  
   Marketing for Epic War Saga (mobile listings) emphasizes large on-screen battles (e.g., “200 units on screen” style messaging), reinforcing the fantasy of huge chaotic fights.

---

## 7) Template blueprint (how to recreate the structure cleanly)

### 7.1 Minimal viable “Epic War Saga-like” template
**Battle layer**
- 2D lane with two spawners
- One controllable hero (HP, mana, summon resource)
- Unit roster with:
  - squad population
  - summon cost
  - aptitude (HP/Atk/Def scaling)
  - attack speed + move speed
  - basic AI (advance/attack)
- Hero spells (cooldowns + mana costs)
- Win/lose rules (hero death loses)

**Meta layer**
- Player level + stat allocation (HP/Atk/Def)
- Equipment with:
  - stat bonuses
  - special modifiers (additive % tags: S/M/L)
- Inventory + crafting materials
- Two crafting stations:
  - Monster Lab (unit recipes consume units + materials)
  - Blacksmith (equipment recipes; upgradeable tiers)
- Quest map / missions (energy)
- Arena (action) + BP + Cave of Trials (BP-only challenges)

### 7.2 Suggested modern improvements (keep feel, fix pain points)
- Deterministic matchmaking and clearer “power rating”
- Better onboarding for aptitude/scaling (show the applied stat math in UI)
- Replay tools: quick-load presets, formation templates
- Server resilience: cache static data locally, gracefully degrade when PvP services are down

---

## 8) Key data tables you’ll want to model (for implementation)

### 8.1 Unit schema (suggested)
- id, name, rarity/tier
- base_hp, base_atk, base_def
- aptitude_hp, aptitude_atk, aptitude_def (or one aptitude used across stats if matching game)
- attack_speed_seconds
- move_speed
- range (melee/ranged) + projectile settings
- population_per_summon
- summon_cost (summon bar)
- special_tags (stun, splash, multi-hit, etc.)
- unlock_method (shop, monster_lab recipe, event)
- upgrade path (optional)

### 8.2 Hero schema
- id, name
- base stats + aptitude rules
- mana, mana_regen
- spells[1..5] (mana_cost, cooldown, effect spec)
- immunity flags (status immune)
- death = loss

### 8.3 Item schema
- slot (weapon/armor/shield/accessory/etc.)
- flat_stat_mods
- special_modifiers (typed + magnitude)
- stack_rule (stackable yes/no; cap)
- source (drop/craft/event/shop)

### 8.4 Crafting recipe schema
- station (blacksmith/monster_lab)
- station_level_required
- inputs:
  - materials (id, qty)
  - gold
  - units consumed (id, qty) [Monster Lab]
- outputs
- premium_skip_cost (crystals)

---

## 9) References (URLs)

### Primary (systems)
- EpicWarSaga Wiki — Game Mechanics: https://epicwarsaga.fandom.com/wiki/Game_Mechanics  
- EpicWarSaga Wiki — Heroes: https://epicwarsaga.fandom.com/wiki/Category:Heroes  
- EpicWarSaga Wiki — Units: https://epicwarsaga.fandom.com/wiki/Category:Units  
- EpicWarSaga Wiki — Items: https://epicwarsaga.fandom.com/wiki/Category:Items  
- EpicWarSaga Wiki — Monster Lab: https://epicwarsaga.fandom.com/wiki/Monster_Lab  
- EpicWarSaga Wiki — Blacksmith: https://epicwarsaga.fandom.com/wiki/Blacksmith  
- EpicWarSaga Wiki — Arena: https://epicwarsaga.fandom.com/wiki/The_Arena  

### Publishing / history / availability
- Kongregate listing (relaunch info + update log): http://www.kongregate.com/games/artlogicgames/epicwar-saga  
- Newgrounds entry: https://www.newgrounds.com/portal/view/608698  
- Epic War Series wiki (history notes incl. downtime/removal/relaunch): https://epicwarseries.fandom.com/wiki/Epic_War_Saga  

---

## 10) Notes on gaps / uncertainty

Some details are hard to lock down without a fully playable build (servers/Flash availability issues are noted by community sources). In particular:
- Exact mission structure per chapter, exact roster counts, and all economy numbers vary across versions (original vs relaunch).
- If you want, next step is a **“systems inventory”**: extract every unique *stat, currency, gate, and loop* into a single diagram + a JSON schema you can implement directly.

