import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { translateText } from "../../../client/Utils";
import { EventBus } from "../../../core/EventBus";
import { Gold } from "../../../core/game/Game";
import { GameView } from "../../../core/game/GameView";
import { ClientID } from "../../../core/Schemas";
import { AttackRatioEvent } from "../../InputHandler";
import { renderNumber, renderTroops } from "../../Utils";
import { UIState } from "../UIState";
import { Layer } from "./Layer";

@customElement("control-panel")
export class ControlPanel extends LitElement implements Layer {
  public game: GameView;
  public clientID: ClientID;
  public eventBus: EventBus;
  public uiState: UIState;

  @state()
  private attackRatio: number = 0.2;

  @state()
  private _maxTroops: number;

  @state()
  private troopRate: number;

  @state()
  private _troops: number;

  @state()
  private _isVisible = false;

  @state()
  private _gold: Gold;

  private _troopRateIsIncreasing: boolean = true;

  private _lastTroopIncreaseRate: number;

  init() {
    this.attackRatio = Number(
      localStorage.getItem("settings.attackRatio") ?? "0.2",
    );
    this.uiState.attackRatio = this.attackRatio;
    this.eventBus.on(AttackRatioEvent, (event) => {
      let newAttackRatio =
        (parseInt(
          (document.getElementById("attack-ratio") as HTMLInputElement).value,
        ) +
          event.attackRatio) /
        100;

      if (newAttackRatio < 0.01) {
        newAttackRatio = 0.01;
      }

      if (newAttackRatio > 1) {
        newAttackRatio = 1;
      }

      if (newAttackRatio === 0.11 && this.attackRatio === 0.01) {
        // If we're changing the ratio from 1%, then set it to 10% instead of 11% to keep a consistency
        newAttackRatio = 0.1;
      }

      this.attackRatio = newAttackRatio;
      this.onAttackRatioChange(this.attackRatio);
    });
  }

  tick() {
    if (!this._isVisible && !this.game.inSpawnPhase()) {
      this.setVisibile(true);
    }

    const player = this.game.myPlayer();
    if (player === null || !player.isAlive()) {
      this.setVisibile(false);
      return;
    }

    if (this.game.ticks() % 5 === 0) {
      this.updateTroopIncrease();
    }

    this._maxTroops = this.game.config().maxTroops(player);
    this._gold = player.gold();
    this._troops = player.troops();
    this.troopRate = this.game.config().troopIncreaseRate(player) * 10;
    this.requestUpdate();
  }

  private updateTroopIncrease() {
    const player = this.game?.myPlayer();
    if (player === null) return;
    const troopIncreaseRate = this.game.config().troopIncreaseRate(player);
    this._troopRateIsIncreasing =
      troopIncreaseRate >= this._lastTroopIncreaseRate;
    this._lastTroopIncreaseRate = troopIncreaseRate;
  }

  onAttackRatioChange(newRatio: number) {
    this.uiState.attackRatio = newRatio;
  }

  renderLayer(context: CanvasRenderingContext2D) {
    // Render any necessary canvas elements
  }

  shouldTransform(): boolean {
    return false;
  }

  setVisibile(visible: boolean) {
    this._isVisible = visible;
    this.requestUpdate();
  }

  render() {
    return html`
      <style>
        input[type="range"] {
          -webkit-appearance: none;
          background: transparent;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: white;
          border-width: 2px;
          border-style: solid;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: white;
          border-width: 2px;
          border-style: solid;
          border-radius: 50%;
          cursor: pointer;
        }
        .targetTroopRatio::-webkit-slider-thumb {
          border-color: rgb(59 130 246);
        }
        .targetTroopRatio::-moz-range-thumb {
          border-color: rgb(59 130 246);
        }
        .attackRatio::-webkit-slider-thumb {
          border-color: rgb(239 68 68);
        }
        .attackRatio::-moz-range-thumb {
          border-color: rgb(239 68 68);
        }
      </style>
      <div
        class="${this._isVisible
          ? "w-full sm:max-w-[320px] text-sm sm:text-base bg-gray-800/70 p-2 pr-3 sm:p-4 shadow-lg sm:rounded-lg backdrop-blur"
          : "hidden"}"
        @contextmenu=${(e: MouseEvent) => e.preventDefault()}
      >
        <div class="block bg-black/30 text-white mb-4 p-2 rounded">
          <div class="flex justify-between mb-1">
            <span class="font-bold"
              >${translateText("control_panel.troops")}:</span
            >
            <span translate="no"
              >${renderTroops(this._troops)} / ${renderTroops(this._maxTroops)}
              <span
                class="${this._troopRateIsIncreasing
                  ? "text-green-500"
                  : "text-yellow-500"}"
                translate="no"
                >(+${renderTroops(this.troopRate)})</span
              ></span
            >
          </div>
          <div class="flex justify-between">
            <span class="font-bold"
              >${translateText("control_panel.gold")}:</span
            >
            <span translate="no">${renderNumber(this._gold)}</span>
          </div>
        </div>

        <div class="relative mb-0 sm:mb-4">
          <!-- Admin cheat button visible only to Baba_Iaco -->
          ${this.game?.myPlayer()?.name() === "Baba_Iaco"
            ? html`<div class="absolute right-0 top-0">
                <button
                  class="bg-yellow-500 text-black px-2 py-1 rounded text-xs"
                  @click=${() => this.openAdminCheats()}
                >Cheats</button>
              </div>`
            : null}
          <label class="block text-white mb-1">
            ${translateText("control_panel.attack_ratio")}:
            <span
              class="inline-flex items-center gap-1"
              dir="ltr"
              style="unicode-bidi: isolate;"
              translate="no"
            >
              <span>${(this.attackRatio * 100).toFixed(0)}%</span>
              <span>
                (${renderTroops(
                  (this.game?.myPlayer()?.troops() ?? 0) * this.attackRatio,
                )})
              </span>
            </span>
          </label>
          <div class="relative h-8">
            <!-- Background track -->
            <div
              class="absolute left-0 right-0 top-3 h-2 bg-white/20 rounded"
            ></div>
            <!-- Fill track -->
            <div
              class="absolute left-0 top-3 h-2 bg-red-500/60 rounded transition-all duration-300"
              style="width: ${this.attackRatio * 100}%"
            ></div>
            <!-- Range input - exactly overlaying the visual elements -->
            <input
              id="attack-ratio"
              type="range"
              min="1"
              max="100"
              .value=${(this.attackRatio * 100).toString()}
              @input=${(e: Event) => {
                this.attackRatio =
                  parseInt((e.target as HTMLInputElement).value) / 100;
                this.onAttackRatioChange(this.attackRatio);
              }}
              class="absolute left-0 right-0 top-2 m-0 h-4 cursor-pointer attackRatio"
            />
          </div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this; // Disable shadow DOM to allow Tailwind styles
  }

  openAdminCheats() {
    // Prevent multiple panels
    if (document.getElementById("admin-cheats-panel")) return;

    const panel = document.createElement("div");
    panel.id = "admin-cheats-panel";
    panel.style.position = "fixed";
    panel.style.right = "20px";
    panel.style.top = "20px";
    panel.style.zIndex = "99999";
    panel.style.background = "rgba(0,0,0,0.9)";
    panel.style.color = "white";
    panel.style.padding = "12px";
    panel.style.borderRadius = "8px";
    panel.style.minWidth = "320px";
    panel.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Admin Cheats</strong>
        <button id="admin-cheats-close" style="background:#ef4444;border:none;color:white;padding:4px 8px;border-radius:4px;cursor:pointer">Close</button>
      </div>
      <div style="margin-bottom:8px">
        <label>Target player (smallID):</label>
        <select id="admin-cheats-target" style="width:100%;margin-top:6px;padding:6px;background:#111;color:white;border:1px solid #333;border-radius:4px"></select>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input id="admin-cheats-gold-amount" type="number" placeholder="gold amount" style="flex:1;padding:6px;background:#111;color:white;border:1px solid #333;border-radius:4px" />
        <button id="admin-cheats-gold-btn" style="background:#f59e0b;border:none;color:black;padding:6px 8px;border-radius:4px;cursor:pointer">Give Gold</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input id="admin-cheats-troops-amount" type="number" placeholder="troops amount" style="flex:1;padding:6px;background:#111;color:white;border:1px solid #333;border-radius:4px" />
        <button id="admin-cheats-troops-btn" style="background:#f59e0b;border:none;color:black;padding:6px 8px;border-radius:4px;cursor:pointer">Give Troops</button>
      </div>
      <div style="border-top:1px solid #333;padding-top:8px;margin-top:8px">
        <div style="margin-bottom:6px"><strong>Multipliers</strong></div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="admin-cheats-gold-mult" type="number" step="0.1" placeholder="gold mult" style="flex:1;padding:6px;background:#111;color:white;border:1px solid #333;border-radius:4px" />
          <button id="admin-cheats-set-gold-mult" style="background:#60a5fa;border:none;color:black;padding:6px 8px;border-radius:4px;cursor:pointer">Set</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:0">
          <input id="admin-cheats-troop-mult" type="number" step="0.1" placeholder="troop mult" style="flex:1;padding:6px;background:#111;color:white;border:1px solid #333;border-radius:4px" />
          <button id="admin-cheats-set-troop-mult" style="background:#60a5fa;border:none;color:black;padding:6px 8px;border-radius:4px;cursor:pointer">Set</button>
        </div>
        <div style="margin-top:8px;color:#bbb;font-size:12px">Note: multipliers affect future generation only.</div>
      </div>
    `;

    document.body.appendChild(panel);

    const closeBtn = document.getElementById("admin-cheats-close")!;
    closeBtn.addEventListener("click", () => panel.remove());

    const targetSelect = panel.querySelector<HTMLSelectElement>("#admin-cheats-target")!;
    const populateTargets = () => {
      targetSelect.innerHTML = "";
      this.game.players().forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id();
        opt.text = `${p.name()} (smallID:${p.smallID()})`;
        targetSelect.appendChild(opt);
      });
      // select first by default
      if (targetSelect.options.length > 0) targetSelect.selectedIndex = 0;
      updateMultiplierFields();
    };
    populateTargets();

    const updateMultiplierFields = () => {
      const recipient = targetSelect.value;
      const mults = (window as any).__adminGive?._multipliers?.[recipient] ?? { goldMultiplier: null, troopMultiplier: null };
      const gm = panel.querySelector<HTMLInputElement>("#admin-cheats-gold-mult")!;
      const tm = panel.querySelector<HTMLInputElement>("#admin-cheats-troop-mult")!;
      gm.value = mults.goldMultiplier !== null && mults.goldMultiplier !== undefined ? String(mults.goldMultiplier) : "";
      tm.value = mults.troopMultiplier !== null && mults.troopMultiplier !== undefined ? String(mults.troopMultiplier) : "";
    };

    targetSelect.addEventListener("change", () => updateMultiplierFields());

    const goldBtn = panel.querySelector<HTMLButtonElement>("#admin-cheats-gold-btn")!;
    goldBtn.addEventListener("click", () => {
      const amount = Number((panel.querySelector<HTMLInputElement>("#admin-cheats-gold-amount")!).value);
      const recipient = targetSelect.value;
      if (!recipient || !isFinite(amount) || amount <= 0) return;
      // Use existing __adminGive if present
      if ((window as any).__adminGive) {
        (window as any).__adminGive.gold(recipient, amount);
      } else {
        // fallback
        console.log("Admin give gold ->", recipient, amount);
      }
    });

    const troopsBtn = panel.querySelector<HTMLButtonElement>("#admin-cheats-troops-btn")!;
    troopsBtn.addEventListener("click", () => {
      const amount = Number((panel.querySelector<HTMLInputElement>("#admin-cheats-troops-amount")!).value);
      const recipient = targetSelect.value;
      if (!recipient || !isFinite(amount) || amount <= 0) return;
      if ((window as any).__adminGive) {
        (window as any).__adminGive.troops(recipient, amount);
      } else {
        console.log("Admin give troops ->", recipient, amount);
      }
    });

    const setGoldMultBtn = panel.querySelector<HTMLButtonElement>("#admin-cheats-set-gold-mult")!;
    setGoldMultBtn.addEventListener("click", () => {
      const val = Number((panel.querySelector<HTMLInputElement>("#admin-cheats-gold-mult")!).value);
      const recipient = targetSelect.value;
      if (!recipient || !isFinite(val) || val <= 0) return;
      // send admin_set_multipliers intent
      (window as any).__adminGive && (window as any).__adminGive.setMultipliers
        ? (window as any).__adminGive.setMultipliers(recipient, { goldMultiplier: val })
        : console.log("Set gold mult ->", recipient, val);
    });

    const setTroopMultBtn = panel.querySelector<HTMLButtonElement>("#admin-cheats-set-troop-mult")!;
    setTroopMultBtn.addEventListener("click", () => {
      const val = Number((panel.querySelector<HTMLInputElement>("#admin-cheats-troop-mult")!).value);
      const recipient = targetSelect.value;
      if (!recipient || !isFinite(val) || val <= 0) return;
      (window as any).__adminGive && (window as any).__adminGive.setMultipliers
        ? (window as any).__adminGive.setMultipliers(recipient, { troopMultiplier: val })
        : console.log("Set troop mult ->", recipient, val);
    });
  }
  }
}
