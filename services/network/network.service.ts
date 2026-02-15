// arken/sigil/services/network/network.service.ts
export class Service {
  async checkConnections(input: any, { app }) {
    console.log(
      "Sigil.Service.Network.checkConnections",
      JSON.stringify(input),
    );

    if (app.settings.webState !== "authorized") return;

    if (app.settings.serverState === "loaded") {
      app.settings = { serverState: "authorizing" };

      CS.Arken.Evolution.NetworkManager.Instance.myPlayerAddress =
        app.settings.auth.address;

      await app.trpc.evolution.shard.login.mutate({
        name: app.settings.auth.name,
        network: "bsc",
        address: app.settings.auth.address,
        device: "desktop",
        signature: app.settings.auth.token,
        version: "1.9.0",
      });
    }
  }
}
