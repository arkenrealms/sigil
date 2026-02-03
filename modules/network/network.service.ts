// arken/sigil/modules/network/network.service.ts
import { getAppData, setAppData } from "../../ui/game/state/useAppData";

export class Service {
  async checkConnections(input: any, { app }) {
    console.log(
      "Sigil.Service.Network.checkConnections",
      JSON.stringify(input),
    );

    if (app.settings.serverState === "loading") {
      setAppData({ serverState: "authorizing" });

      CS.Arken.Evolution.NetworkManager.Instance.myPlayerAddress =
        input.address;

      await app.trpc.evolution.shard.login.mutate({
        name: input.name,
        network: "bsc",
        address: input.address,
        device: "desktop",
        signature: input.token,
        version: "1.9.0",
      });
    }
  }
}
