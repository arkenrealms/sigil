import { useEffect, useState } from "preact/hooks";
import { subscribeAppData, getAppData } from "../ui/game/state/useAppData";

export function useAppSettings(app: any) {
  // initialize from current store
  const [settings, setSettings] = useState(() => app.settings);

  useEffect(() => {
    return subscribeAppData(() => {
      // pull latest settings after any store update
      setSettings(getAppData().settings ?? app.settings);
    });
  }, [app]);

  return settings;
}
