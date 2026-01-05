// sigil/util/index.ts
//
export const nowMs = () => Date.now();

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Returns REMAINING fraction of cooldown: 1 -> 0
 * - 1 means just started
 * - 0 means finished
 */
export function computeFrac(lastAtMs: number, durationSec: number, t: number) {
  if (!durationSec || durationSec <= 0) return 0;
  const dur = durationSec * 1000;
  const elapsed = t - lastAtMs;
  if (elapsed <= 0) return 1;
  return clamp01(1 - elapsed / dur);
}

export function canUse(lastAtMs: number, durationSec: number, t: number) {
  return computeFrac(lastAtMs, durationSec, t) <= 0;
}

export function stopEvent(e: any) {
  if (!e) return;

  // DOM-style
  if (typeof e.preventDefault === "function") e.preventDefault();
  if (typeof e.stopPropagation === "function") e.stopPropagation();
  if (typeof e.stopImmediatePropagation === "function")
    e.stopImmediatePropagation();

  // Unity UIElements-style (PascalCase)
  if (typeof e.PreventDefault === "function") e.PreventDefault();
  if (typeof e.StopPropagation === "function") e.StopPropagation();

  // Some OneJS builds expose these too
  if (typeof e.StopImmediatePropagation === "function")
    e.StopImmediatePropagation();
}
