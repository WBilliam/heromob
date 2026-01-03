import { defineComponent, inject, onMounted, onBeforeUnmount, ref } from "../../lib/vue.js";
import BuildPanel from "../BuildPanel.js";
import CreaturePanel from "../CreaturePanel.js";
import Battlefield from "../Battlefield.js";

export default defineComponent({
  name: "DevScreen",
  components: { BuildPanel, CreaturePanel, Battlefield },
  setup() {
    const battle = inject("battle");
    const importInputRef = ref(null);

    const buildExportName = () => "stage-config.json";

    const runImport = (jsonText) => {
      if (!battle) return;
      const result = battle.importStageConfigJson(jsonText);
      if (!result.ok) {
        window.alert(result.error || "Unable to import stage data.");
      }
    };

    const importFromFile = async (file) => {
      if (!file) return;
      const text = await file.text();
      runImport(text);
    };

    const handleImportFile = async (event) => {
      const file = event.target.files?.[0];
      if (file) {
        await importFromFile(file);
      }
      event.target.value = "";
    };

    const importStages = async () => {
      if (!battle) return;
      try {
        if (window.showOpenFilePicker) {
          const [handle] = await window.showOpenFilePicker({
            types: [
              {
                description: "Stage JSON",
                accept: { "application/json": [".json"] },
              },
            ],
            multiple: false,
          });
          const file = await handle.getFile();
          await importFromFile(file);
          return;
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
      if (importInputRef.value) {
        importInputRef.value.click();
        return;
      }
      window.alert("Unable to open the stage file.");
    };

    const exportStages = async () => {
      if (!battle) return;
      const json = battle.exportStageConfigJson();
      const fileName = buildExportName();
      try {
        if (window.showDirectoryPicker) {
          const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
          const fileHandle = await dirHandle.getFileHandle(fileName, {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          await writable.write(json);
          await writable.close();
          return;
        }
        if (window.showSaveFilePicker) {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: "Stage JSON",
                accept: { "application/json": [".json"] },
              },
            ],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(json);
          await writable.close();
          return;
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
      }

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    const saveStagesToDisk = async () => {
      if (!battle) return;
      const json = battle.exportStageConfigJson();
      try {
        const response = await fetch("/api/save-stage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: json,
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Unable to save stage file.");
        }
        window.alert("Saved to public/stages/stage-config.json.");
      } catch (error) {
        window.alert(error?.message || "Unable to save stage file.");
      }
    };

    onMounted(() => {
      if (!battle) return;
      battle.resetBattle();
      battle.enterDevMode();
    });

    onBeforeUnmount(() => {
      if (!battle) return;
      battle.stopBattle();
    });

      return {
        ...battle,
        importInputRef,
        importStages,
        exportStages,
        saveStagesToDisk,
        handleImportFile,
      };
    },
  template: `
    <section class="dev-screen dev-mode">
      <header class="dev-toolbar">
        <div class="dev-toolbar-main">
          <div class="dev-title">Enemy Config Mode</div>
          <div class="dev-subtitle">Place enemy buildings and assign spawns per stage.</div>
          <div class="dev-stage-label">{{ devStageLabel }}</div>
          <div class="dev-note">Save to public/stages/stage-config.json to auto-load.</div>
        </div>
        <div class="dev-toolbar-actions">
          <div class="stage-selector">
            <button
              v-for="index in stageCount"
              :key="index"
              class="btn btn-ghost"
              :class="{ active: devStageIndex === index - 1 }"
              type="button"
              @click="setDevStage(index - 1)"
            >
              Stage {{ index }}
            </button>
          </div>
          <button
            class="btn btn-ghost"
            :class="{ active: isBossBattle }"
            type="button"
            @click="toggleBossBattle"
          >
            Boss Battle: {{ isBossBattle ? "On" : "Off" }}
          </button>
          <button class="btn btn-ghost" type="button" @click="importStages">
            Import JSON
          </button>
          <button class="btn" type="button" @click="exportStages">
            Export JSON
          </button>
          <button class="btn" type="button" @click="saveStagesToDisk">
            Save Stage
          </button>
          <button class="btn btn-secondary" type="button" @click="clearDevStage">
            Clear Stage
          </button>
        </div>
        <input
          ref="importInputRef"
          type="file"
          accept="application/json,.json"
          style="display:none"
          @change="handleImportFile"
        />
      </header>
      <main class="battlefield-area dev-area">
        <BuildPanel
          title="Enemy Buildings"
          subtitle="Drag into the enemy zone (top third)."
          :drag-handler="startEnemyBuildingDrag"
        />
        <Battlefield />
        <CreaturePanel
          title="Enemy Creatures"
          subtitle="Drag onto an enemy nest to assign spawns."
          :creatures="devCreatureOptions"
          :drag-handler="startEnemyCreatureDrag"
        />
      </main>
    </section>
  `,
});
