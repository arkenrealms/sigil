import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

/**
 * UI Toolkit / OneJS Transition:
 * - Uses inline style (NOT class switching) to avoid USS class timing issues.
 * - Two-phase apply: set "from" then next tick set "to" to trigger transition.
 * - Keeps element mounted during leave animation, unmounts after transition end.
 */

export type TransitionStyle = Partial<CS.OneJS.Dom.DomStyle>;

export type TransitionProps = {
  show: boolean;
  children?: any;

  /** Transition tuning */
  durationMs?: number; // default 180
  easing?: string; // e.g. "ease-out"

  /**
   * Styles for phases.
   * Typically animate: opacity + translate (scale is unreliable in UITK).
   */
  enterFrom?: TransitionStyle;
  enterTo?: TransitionStyle;
  leaveFrom?: TransitionStyle;
  leaveTo?: TransitionStyle;

  /** Extra style always applied */
  style?: TransitionStyle;

  /** Optional: keeps mounted even when hidden (still animates) */
  keepMounted?: boolean;

  /** If true, run enter transition on first mount when show=true */
  appear?: boolean;
};

export function Transition(props: TransitionProps) {
  const {
    show,
    children,
    durationMs = 180,
    easing = "ease-out",
    enterFrom,
    enterTo,
    leaveFrom,
    leaveTo,
    style,
    keepMounted = false,
    appear = false,
  } = props;

  const first = useRef(true);
  const [mounted, setMounted] = useState(show);
  const [phaseStyle, setPhaseStyle] = useState<TransitionStyle>(() => ({}));
  const leavingRef = useRef(false);

  const transitionStyle = useMemo<TransitionStyle>(() => {
    return {
      transitionProperty: "opacity, translate",
      transitionDuration: durationMs / 1000, // seconds
      transitionTimingFunction: easing,
    };
  }, [durationMs, easing]);

  useEffect(() => {
    // initial
    if (first.current) {
      first.current = false;

      if (show) {
        setMounted(true);

        if (appear) {
          // paint "from", then tick to "to"
          setPhaseStyle(enterFrom || {});
          setTimeout(() => setPhaseStyle(enterTo || {}), 0);
        } else {
          setPhaseStyle(enterTo || {});
        }
      } else {
        setMounted(keepMounted ? true : false);
        setPhaseStyle(leaveTo || {});
      }
      return;
    }

    // subsequent toggles
    if (show) {
      leavingRef.current = false;
      setMounted(true);

      // IMPORTANT: apply from first, then to next tick
      setPhaseStyle(enterFrom || {});
      setTimeout(() => {
        // guard: if user toggled back quickly
        if (!leavingRef.current) setPhaseStyle(enterTo || {});
      }, 0);
    } else {
      leavingRef.current = true;

      // leaveFrom first (current state), then leaveTo
      setPhaseStyle(leaveFrom || {});
      setTimeout(() => {
        if (leavingRef.current) setPhaseStyle(leaveTo || {});
      }, 0);
    }
  }, [show, appear, keepMounted, enterFrom, enterTo, leaveFrom, leaveTo]);

  function onTransitionEnd() {
    // when finishing a leave, unmount (unless keepMounted)
    if (!show && leavingRef.current) {
      if (!keepMounted) setMounted(false);
      // reset to a stable hidden state
      setPhaseStyle(leaveTo || {});
    }
  }

  if (!mounted && !keepMounted) return null;

  const merged: TransitionStyle = {
    ...(style || {}),
    ...transitionStyle,
    ...phaseStyle,
  };

  return (
    <div style={merged} onTransitionEnd={onTransitionEnd}>
      {children}
    </div>
  );
}
