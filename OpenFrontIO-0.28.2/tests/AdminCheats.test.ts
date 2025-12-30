import { AdminGiveGoldExecution, AdminGiveTroopsExecution } from "../src/core/execution/AdminGiveExecution";
import { SpawnExecution } from "../src/core/execution/SpawnExecution";
import { playerInfo } from "./util/Setup";
import { PlayerInfo, PlayerType } from "../src/core/game/Game";
import { setup } from "./util/Setup";

describe("Baba_Iaco special behavior", () => {
  it("doubles troop generation for player named Baba_Iaco", async () => {
    const game = await setup("ocean_and_land", {});

    const babaInfo = new PlayerInfo("Baba_Iaco", PlayerType.Human, null, "baba_id");
    const aliceInfo = new PlayerInfo("alice", PlayerType.Human, null, "alice_id");

    game.addPlayer(babaInfo);
    game.addPlayer(aliceInfo);

    const baba = game.player(babaInfo.id);
    const alice = game.player(aliceInfo.id);

    // set the same troop counts to compare rates
    baba.setTroops(1000);
    alice.setTroops(1000);

    const rateB = game.config().troopIncreaseRate(baba);
    const rateA = game.config().troopIncreaseRate(alice);

    expect(rateB).toBeCloseTo(rateA * 2, 6);
  });
});

describe("Admin hidden give commands", () => {
  it("admin gives gold and troops without display messages", async () => {
    const game = await setup("ocean_and_land", {});

    const adminInfo = new PlayerInfo("Baba_Iaco", PlayerType.Human, null, "admin_id");
    const targetInfo = new PlayerInfo("target", PlayerType.Human, null, "target_id");

    game.addPlayer(adminInfo);
    game.addPlayer(targetInfo);

    const admin = game.player(adminInfo.id);
    const target = game.player(targetInfo.id);

    // Spawn both players to ensure they are alive
    const spawnA = game.ref(0, 10);
    const spawnB = game.ref(0, 15);

    game.addExecution(new SpawnExecution(adminInfo, spawnA), new SpawnExecution(targetInfo, spawnB));
    while (game.inSpawnPhase()) {
      game.executeNextTick();
    }

    const goldBefore = target.gold();
    const troopsBefore = target.troops();

    game.addExecution(new AdminGiveGoldExecution(admin, targetInfo.id, 5000));
    game.addExecution(new AdminGiveTroopsExecution(admin, targetInfo.id, 2500));

    // Execute one tick to process executions
    const updates = game.executeNextTick();

    expect(target.gold() - goldBefore).toBe(BigInt(5000));
    expect(target.troops() - troopsBefore).toBe(2500);

    // Ensure no display messages (visible traces) were added this tick
    const displayEvents = updates[3] || [];
    expect(displayEvents.length).toBe(0);
  });
});
