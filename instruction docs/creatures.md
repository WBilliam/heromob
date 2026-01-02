# creature stats
## hp
how many hitpoints a creature has.
## atk
how much damage a creature deals. the final damage each creature deals is calculated as so:
    damage = atk * (1 + type + element)
how frequent a creature attacks (attacks per second) is calculated as so:
    atk rate = (spd / 10) + (atk / 100)
## pop
how many creatures can be spawned on the battle field at the same time. if their limit is reached, their spawning nest building pauses spawining timer until more pop spots are available.
## spd
how fast a creature moves through the battlefield. the spawning timer of the nest building (how many creatures are spawned per second) is calculated as so:
    spawning timer = nest(building) timer * (1 - (spd/100))
# creatures categorization
## 1. level
### minions
the weakest type of creatures. they spawn directly from the base. very high pop
### units
all the rest type of creatures. they spawn from nest building.
### titans
the strongest type of creatures. they spawn from super nest building. very low pop
## 2. type
type effectiveness is calculated as so:
    type = +0.2 for effective
    type = 0 for not effective
    type = -0.2 for resisting
creature type effectiveness table:
memo:
    + = effective
    0 = not effective
    - = resisting

| attacking/defending | melee | ranged | area | cavalry | flying |
| :-----------------: | :---: | :----: | :--: | :-----: | :----: |
|        melee        |   0   |   -    |  0   |    0    |   +    |
|       ranged        |   +   |   0    |  0   |    -    |   0    |
|        area         |   0   |   0    |  0   |    +    |   -    |
|       cavalry       |   0   |   +    |  -   |    0    |   0    |
|       flying        |   -   |   0    |  +   |    0    |   0    |

### melee
deals damage up close.
### ranged
deal damage from a range, targets the single closest enemy creature.
the range(distance) from they can attack is calculated as so:
    range = (spd + atk) / 10
### area
deal damage from a range, targets a random single enemy creature but deals damage to the area around that creature. the damage radius is calculated as so:
    aoe = (atk + hp) / 100
### cavalry
deal damage up close. have knock back attack (enemy creatures that are hit by a cavalry creature attack are knocked back a little). the knockback distance an enemy creature is thrown is calculated as so:
    knockback = (spd / 10) + (hp / 100)
### flying
deal damage up close. they ignore obstacles of the battlefield. they ignore enemy buildings and go straight for the closest enemy creature, else if there are no more enemy creatures on the battlefield, they go for the enemy base instead.
## 3. element
element effectiveness is calculated as so:
    element = +0.4 for effective
    element = 0 for not effective
    element = -0.4 for resisting
   
creature type effectiveness table:
memo:
    + = effective
    0 = not effective
    - = resisting

| attacking/defending | fire | water | earth | wind | thunder | dark | light |
| :-----------------: | :--: | :---: | :---: | :--: | :-----: | :--: | :---: |
|        fire         |  0   |   -   |   +   |  0   |    0    |  0   |   0   |
|        water        |  +   |   0   |   0   |  0   |    -    |  0   |   0   |
|        earth        |  -   |   0   |   0   |  +   |    0    |  0   |   0   |
|        wind         |  0   |   0   |   -   |  0   |    +    |  0   |   0   |
|       thunder       |  0   |   +   |   0   |  -   |    0    |  0   |   0   |
|        dark         |  0   |   0   |   0   |  0   |    0    |  -   |   +   |
|        light        |  0   |   0   |   0   |  0   |    0    |  +   |   -   |

some battlefield stages have elemental obstacles. the creatures with the same element as the obstacle's element, can ignore the obsatcle's movement restriction and move past it with their regular movement speed. 
## 4. movement
each creature has a specific movement style. this describes how each creature behaves in the battlefield, what targets as a priority etc.
the movement of each creature is unique and is described on each individual creature's file.
