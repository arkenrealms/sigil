// arken/sigil/modules/core/core.service.ts
// import {
//   loadPrefsJson,
//   savePrefsJson,
//   clearPrefs,
// } from "../../ui/core/state/persist";
import { getAppData, setAppData } from "../../ui/game/state/useAppData";
import { isValidAuth } from "../../util/isValidAuth";
import { ensureManagedScenes, onChangeGame } from "../../util/unity/scene";

export class Service {
  // async onBridgeInitialized(input, { app }) {
  //   console.log(
  //     "Sigil.Service.Core.onBridgeInitialized",
  //     JSON.stringify(input),
  //   );

  //   // setTimeout(() => this.onAppInitializing(input, { app }), 0);
  //   // await this.onAppInitializing(input, { app });
  //   // CS.Arken.Bridge.Instance.HandleWebviewEvent(
  //   //   "sigil.core",
  //   //   "onAppInitializing",
  //   //   JSON.stringify({
  //   //     productName: CS.UnityEngine.Application.productName,
  //   //     companyName: CS.UnityEngine.Application.companyName,
  //   //     identifier: CS.UnityEngine.Application.identifier,
  //   //     version: CS.UnityEngine.Application.version,
  //   //     platform: CS.UnityEngine.Application.platform,
  //   //   }),
  //   // );
  // }

  async onAppInitializing(input, { app }) {
    console.log("Sigil.Service.Core.onAppInitializing", JSON.stringify(input));

    app.settings = {
      appState: "initializing",
      serverState: "none",
      webState: "initializing",
      info: input,
    };

    await ensureManagedScenes(["Shared", "R_Game", "Sound"], {
      managedScenes: [
        "Entry",
        "Shared",
        // "E_UI",
        "E_Pool",
        "Sound",
        "E_Game",
        "R_Game",
        "E_MageIsles",
        "E_MemeIsles",
        "E_EndOfTime",
      ],
      logging: true,
      // Keep sequential loading unless you *know* parallel is safe
      parallel: false,
    });

    app.settings = { appState: "initialized" };
  }

  async onWebInitializing(input, { app }) {
    console.log("Sigil.Service.Core.onWebInitializing", JSON.stringify(input));

    app.settings = { webState: "initializing" };
  }

  async onClick(input: any, { app }) {
    console.log("Sigil.Service.Core.onClick", JSON.stringify(input));

    if (input.name !== "Portal") return;
    if (app.settings.webState !== "authorized") return;
    if (app.settings.appState !== "initialized") return;

    const res2 = await app.trpc.seer.core.play.query({
      appIdentifier: app.settings.info.identifier,
    });

    console.log("onClick core.play", JSON.stringify(res2));

    if (res2.type === "shard") {
      app.settings = { serverState: "connecting" };

      // CS.Arken.Evolution.NetworkManager.Instance.serverAddress = res2.address;

      CS.Arken.Evolution.NetworkManager.Instance.Connect(res2.address);
    }
  }

  async onWebInitialized(input, { app }) {
    console.log(
      "Sigil.Service.Core.onWebInitialized",
      JSON.stringify(input),
      JSON.stringify(app.settings),
    );

    if (app.settings.webState !== "initializing") return;

    // app.settings = { webState: "initialized" };

    // const auth = loadPrefsJson("auth");
    const auth = app.settings.auth;

    if (isValidAuth(auth)) {
      app.settings = { auth, webState: "authorizing" };

      await app.trpc.forge.core.authorize.mutate(auth);

      console.log("aaaaaa authorized");
      //   CS?.Arken?.Bridge?.Instance?.Authorize?.(JSON.stringify(auth));

      // Arken.SeerClient.Instance.Emit("core.authorize", jo);

      // Arken.Web.WebCommunicator.Instance.Execute(
      //     $"window.unity.authorize({auth});"
      // );
    } else {
      // clearPrefs("auth"); // ✅ prevent infinite bad authorize attempts
      app.settings = { auth: undefined };
    }
  }

  onWebviewError(input: string, { app }) {
    if (input === "CloudflareBadGateway") {
      app.settings = { webState: "error" };
    }
  }

  async onWebAuthorized(input: any, { app }) {
    console.log("Sigil.Service.Core.onWebAuthorized", JSON.stringify(input));

    if (app.settings.webState !== "authorizing") return;

    if (!isValidAuth(input)) {
      app.settings = { webState: "none", auth: undefined };
      // setAppData({ webState: "none" }); // or error if you prefer
      return;
    }

    app.settings = { auth: input };

    console.log("onAuthorize seer.core.authorize", input);

    const res = await app.trpc.seer.core.authorize.mutate({
      data: "evolution",
      address: input.address,
      token: input.token,
      appIdentifier: app.settings.info.identifier, // gg.arken.realms gg.arken.evolution gg.arken.infinite gg.arken.trek
    });

    console.log("onWebAuthorized core.authorize", res);

    const profile = await app.trpc.seer.profile.me.query();

    console.log("onWebAuthorized profile.me", JSON.stringify(profile));

    app.settings = { profile: input, webState: "authorized" };

    app.service.network.checkConnections(null, { app });
  }
}
