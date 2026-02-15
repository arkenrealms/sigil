// arken/sigil/services/realm/realm.service.ts
import { getAppData, setAppData } from "../../ui/game/state/useAppData";

export class Service {
  async test(input: any, ctx: any) {
    console.log("Sigil.Service.Realm.test", JSON.stringify(input));
  }
}
