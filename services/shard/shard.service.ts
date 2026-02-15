// arken/sigil/services/shard/shard.service.ts
import { getAppData, setAppData } from "../../ui/game/state/useAppData";

export class Service {
  async test(input: any, ctx: any) {
    console.log("Sigil.Service.Shard.test", JSON.stringify(input));
  }
}
