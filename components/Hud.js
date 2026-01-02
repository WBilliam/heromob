import { defineComponent, inject } from "../lib/vue.js";

const StatusCard = defineComponent({
  name: "StatusCard",
  props: {
    team: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Number, required: true },
    max: { type: Number, required: true },
    percent: { type: Number, required: true },
  },
  template: `
    <div class="status" :class="team">
      <div class="label">{{ label }}</div>
      <div class="bar">
        <span :style="{ width: percent + '%' }"></span>
      </div>
      <div class="value">{{ value }} / {{ max }}</div>
    </div>
  `,
});

export default defineComponent({
  name: "Hud",
  components: { StatusCard },
  setup() {
    const battle = inject("battle");
    return { ...battle };
  },
  template: `
    <header class="hud">
      <StatusCard
        team="enemy"
        label="Enemy Base"
        :value="enemyBase.hp"
        :max="baseMaxHp"
        :percent="enemyHpPercent"
      />

      <div class="center">
        <div class="title">Stage 2 Battle Prototype</div>
        <div class="subtitle">Place nests, walls, and towers to push to the base.</div>
        <button class="btn" type="button" @click="restartBattle">Restart</button>
      </div>

      <StatusCard
        team="player"
        label="Player Base"
        :value="playerBase.hp"
        :max="baseMaxHp"
        :percent="playerHpPercent"
      />
    </header>
  `,
});
