the battlefield is the area where battles occur. it defines stage flow, enemy setup, and environment effects.

## enemy placement/ai (dev tool)
create a developer-only ui to configure enemy layouts per stage. this menu is a toggleable dev mode and must be disabled for players during normal gameplay.
the tool should allow the developer to place enemy buildings and creatures for each stage of a battle.

## stages
regular battles have 3 stages. boss fights have 5 stages.
the player wins by clearing all stages in the battle.
each stage scales in difficulty relative to the previous stage.

## obstacles (later development)
some stages include area obstacles that affect movement for both player and enemy creatures.
obstacles have elemental properties (fire/water/earth/wind/thunder/light/dark), matching creature elements.
when a creature enters an obstacle, it receives a status effect such as:
- damage over time
- reduced movement speed
- chance to be stunned
- etc

creatures with the same element as the obstacle ignore its negative status effects.
all flying type creatures also ignore obstacle effects.
