import { useEffect, useState } from "preact/hooks";

// ✅ default to 125%
let zoomPercent = 125; // percent
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setUiZoomPercent(next: number) {
  // ✅ constrain to 50%–150% and avoid scale=0
  const clamped = Math.max(50, Math.min(150, Math.round(next)));
  if (clamped === zoomPercent) return;
  zoomPercent = clamped;
  emit();
}

export function getUiZoomPercent() {
  return zoomPercent;
}

export function useUiZoomPercent() {
  const [, force] = useState(0);

  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);

  return zoomPercent;
}
