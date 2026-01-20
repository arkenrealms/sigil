// sigil/modules/web/web.service.ts
import { loadPrefsJson, savePrefsJson } from "../../ui/core/state/persist";
import { setGameState } from "../../ui/game/state/useGameStore";

export class Service {
  onInitializing(_input?: { args?: string }) {
    setGameState({ webState: "initializing" });
  }

  onInitialized(_input?: { args?: string }) {
    setGameState({ webState: "initialized" });

    const auth = loadPrefsJson("auth");
    if (auth) {
      setGameState({ webState: "authorizing" });
      CS?.Arken?.Bridge?.Instance?.Authorize?.(JSON.stringify(auth));
    }
  }

  onAuthorized(input: { args: string }) {
    const auth = JSON.parse(input.args);

    // always reflect the latest profile into state
    setGameState({ profile: auth });

    if (auth?.address && auth?.token) {
      savePrefsJson("auth", auth);
      setGameState({ webState: "authorized" });
    } else {
      setGameState({ webState: "authorized" });
    }
  }
}
