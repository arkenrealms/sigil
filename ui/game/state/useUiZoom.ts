import { useEffect, useState } from "preact/hooks";

declare const CS: any;

// Base design width
const BASE_WIDTH = 1024;

// Allow your example: 512px => 200%
const MIN_ZOOM = 80;
const MAX_ZOOM = 130;

let zoomPercent = 100;
let didInit = false;

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function clampZoom(v: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(v)));
}

function getScreenWidth(): number {
  try {
    const w = CS?.UnityEngine?.Screen?.width;
    if (typeof w === "number" && w > 0) return w;
  } catch {
    // ignore
  }
  return BASE_WIDTH;
}

function computeDefaultZoomFromScreen(): number {
  const w = getScreenWidth();
  return clampZoom((BASE_WIDTH / w) * 100);
}

function ensureInit() {
  if (didInit) return;
  didInit = true;
  zoomPercent = computeDefaultZoomFromScreen();
}

export function setUiZoomPercent(next: number) {
  ensureInit();
  const clamped = clampZoom(next);
  if (clamped === zoomPercent) return;
  zoomPercent = clamped;
  emit();
}

export function getUiZoomPercent() {
  ensureInit();
  return zoomPercent;
}

export function useUiZoomPercent() {
  const [, force] = useState(0);

  useEffect(() => {
    ensureInit();

    const l = () => force((x) => x + 1);
    listeners.add(l);

    // Poll for resolution changes (OneJS-safe)
    let lastW = getScreenWidth();
    const id = setInterval(() => {
      const w = getScreenWidth();
      if (w !== lastW) {
        lastW = w;
        const next = computeDefaultZoomFromScreen();
        if (next !== zoomPercent) {
          zoomPercent = next;
          emit();
        }
      }
    }, 250);

    return () => {
      clearInterval(id);
      listeners.delete(l);
    };
  }, []);

  return zoomPercent;
}
