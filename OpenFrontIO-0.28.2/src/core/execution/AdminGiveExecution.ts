import { Execution, Game, Player, PlayerID } from "../game/Game";
import { PseudoRandom } from "../PseudoRandom";

export class AdminGiveGoldExecution implements Execution {
  private recipient!: Player;
  private random!: PseudoRandom;
  private mg!: Game;
  private active = true;

  constructor(
    private sender: Player,
    private recipientID: PlayerID,
    private gold: number,
  ) {}

  init(mg: Game, ticks: number): void {
    this.mg = mg;
    this.random = new PseudoRandom(mg.ticks());

    if (!mg.hasPlayer(this.recipientID)) {
      console.warn(`AdminGiveGoldExecution recipient ${this.recipientID} not found`);
      this.active = false;
      return;
    }

    // Authorization: only allow if sender's name is exactly "Baba_Iaco"
    if (this.sender.name() !== "Baba_Iaco") {
      console.warn(
        `AdminGiveGoldExecution: unauthorized sender ${this.sender.name()}`,
      );
      this.active = false;
      return;
    }

    this.recipient = mg.player(this.recipientID);
  }

  tick(_ticks: number): void {
    if (!this.active) return;
    try {
      const amount = BigInt(Math.max(0, Math.floor(this.gold)));
      if (amount <= 0n) {
        this.active = false;
        return;
      }
      // Add gold directly without emitting any in-game visible BonusEvent or messages
      this.recipient.addGold(amount);
    } catch (err) {
      console.warn("AdminGiveGoldExecution failed:", err);
    }
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }
}

export class AdminGiveTroopsExecution implements Execution {
  private recipient!: Player;
  private random!: PseudoRandom;
  private mg!: Game;
  private active = true;

  constructor(
    private sender: Player,
    private recipientID: PlayerID,
    private troops: number,
  ) {}

  init(mg: Game, ticks: number): void {
    this.mg = mg;
    this.random = new PseudoRandom(mg.ticks());

    if (!mg.hasPlayer(this.recipientID)) {
      console.warn(`AdminGiveTroopsExecution recipient ${this.recipientID} not found`);
      this.active = false;
      return;
    }

    // Authorization: only allow if sender's name is exactly "Baba_Iaco"
    if (this.sender.name() !== "Baba_Iaco") {
      console.warn(
        `AdminGiveTroopsExecution: unauthorized sender ${this.sender.name()}`,
      );
      this.active = false;
      return;
    }

    this.recipient = mg.player(this.recipientID);
  }

  tick(_ticks: number): void {
    if (!this.active) return;
    try {
      const amount = Math.max(0, Math.floor(this.troops));
      if (amount <= 0) {
        this.active = false;
        return;
      }
      // Add troops directly without emitting any in-game visible messages
      this.recipient.addTroops(amount);
    } catch (err) {
      console.warn("AdminGiveTroopsExecution failed:", err);
    }
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }
}

export class AdminSetMultipliersExecution implements Execution {
  private recipient!: Player;
  private mg!: Game;
  private active = true;

  constructor(
    private sender: Player,
    private recipientID: PlayerID,
    private goldMultiplier: number | null,
    private troopMultiplier: number | null,
  ) {}

  init(mg: Game, _ticks: number): void {
    this.mg = mg;
    if (!mg.hasPlayer(this.recipientID)) {
      console.warn(`AdminSetMultipliersExecution recipient ${this.recipientID} not found`);
      this.active = false;
      return;
    }

    if (this.sender.name() !== "Baba_Iaco") {
      console.warn(
        `AdminSetMultipliersExecution: unauthorized sender ${this.sender.name()}`,
      );
      this.active = false;
      return;
    }

    this.recipient = mg.player(this.recipientID);
  }

  tick(_ticks: number): void {
    if (!this.active) return;
    try {
      if (this.goldMultiplier !== null && this.goldMultiplier !== undefined) {
        this.recipient.setGoldMultiplier(this.goldMultiplier);
      }
      if (this.troopMultiplier !== null && this.troopMultiplier !== undefined) {
        this.recipient.setTroopMultiplier(this.troopMultiplier);
      }
    } catch (err) {
      console.warn("AdminSetMultipliersExecution failed:", err);
    }
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }
}
