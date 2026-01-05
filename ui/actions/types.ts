export type ActionDef = {
  id: string;
  keybind?: string;
  src?: string;
  name?: string;
  description?: string;
  isSelf?: boolean;
  cooldown?: number; // seconds
  globalCooldown?: number; // seconds
};

export type ActionRuntime = {
  toggled: boolean;
  lastUsedAt: number; // ms epoch
  lastGlobalAt: number; // ms epoch (unused for now, but kept)
};
