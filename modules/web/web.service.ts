// arken/sigil/modules/web/web.service.ts
import {
  loadPrefsJson,
  savePrefsJson,
  clearPrefs,
} from "../../ui/core/state/persist";
import { getGameState, setGameState } from "../../ui/game/state/useGameStore";
import { isValidAuth } from "../../util/isValidAuth";

export class Service {
  onInitializing(_input?: { args?: string }) {
    console.log("Service.Web.onInitializing", JSON.stringify(_input));

    setGameState({ webState: "initializing" });
  }

  onInitialized(_input?: { args?: string }) {
    console.log("Service.Web.onInitialized", JSON.stringify(_input));

    const gs = getGameState();

    if (gs.webState !== "initializing") return;

    setGameState({ webState: "initialized" });

    const auth = loadPrefsJson("auth");

    if (isValidAuth(auth)) {
      setGameState({ webState: "authorizing" });
      CS?.Arken?.Bridge?.Instance?.Authorize?.(JSON.stringify(auth));
    } else if (auth) {
      clearPrefs("auth"); // ✅ prevent infinite bad authorize attempts
    }
  }

  async onAuthorized(input: { args: string }, ctx: any) {
    console.log("Service.Web.onAuthorized", JSON.stringify(input));

    const gs = getGameState();

    if (gs.webState !== "authorizing") return;

    const auth = JSON.parse(input.args);
    setGameState({ profile: auth });

    if (!isValidAuth(auth)) {
      clearPrefs("auth");
      setGameState({ webState: "initialized" }); // or "none" if you prefer
      return;
    }

    savePrefsJson("auth", auth);
    setGameState({ webState: "authorized" });

    if (gs.serverState === "loading") {
      setGameState({ serverState: "authorizing" });

      CS.Arken.Evolution.NetworkManager.Instance.myPlayerAddress = auth.address;

      await ctx.app.trpc.evolution.shard.login.mutate({
        name: auth.name,
        network: "bsc",
        address: auth.address,
        device: "desktop",
        signature: auth.token,
        version: "1.9.0",
      });
    }
  }
}
