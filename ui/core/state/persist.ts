// sigil/ui/core/state/persist.ts
type Persisted<T> = { t: number; v: T };

function nowMs() {
  return typeof Date !== "undefined" ? Date.now() : 0;
}

export function loadPrefsJson<T>(
  key: string,
  maxAgeMs: number = 300_000
): T | null {
  try {
    const raw = CS.UnityEngine.PlayerPrefs.GetString(key, "");
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { t?: number; v: T };
    if (!parsed || typeof parsed !== "object") return null;

    if (maxAgeMs && parsed.t && Date.now() - parsed.t > maxAgeMs) {
      return null;
    }

    return parsed.v ?? (parsed as T);
  } catch {
    return null;
  }
}

export function savePrefsJson<T>(key: string, value: T) {
  try {
    const payload: Persisted<T> = { t: nowMs(), v: value };
    CS?.UnityEngine?.PlayerPrefs?.SetString?.(key, JSON.stringify(payload));
    CS?.UnityEngine?.PlayerPrefs?.Save?.();
  } catch {
    // ignore
  }
}

export function clearPrefs(key: string) {
  try {
    CS?.UnityEngine?.PlayerPrefs?.DeleteKey?.(key);
    CS?.UnityEngine?.PlayerPrefs?.Save?.();
  } catch {
    // ignore
  }
}
