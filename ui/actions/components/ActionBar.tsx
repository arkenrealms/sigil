// sigil/ui/actions/components/ActionBar.tsx
//
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { ActionDef, ActionRuntime } from "../types";
import { canUse, computeFrac, nowMs } from "../../../util";
import styled from "../../../util/styled";
import { ActionSlot } from "./ActionSlot";

const PAGE_SIZE = 4;
const SWIPE_PX = 22;

const Wrap = styled.div``;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
`;

const Dots = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 6px;
  opacity: 0.8;
`;

const SlotSpacer = styled.div<{ $last?: boolean }>`
  margin-right: ${(p) => (p.$last ? "0px" : "6px")};
`;

const DotWrap = styled.div<{ $last?: boolean }>`
  margin-right: ${(p) => (p.$last ? "0px" : "6px")};
`;

const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 999px;
`;

export const ActionBar = (props: {
  actions: ActionDef[];
  onUse: (id: string) => void;
  onToggle?: (id: string, newState: boolean) => void;
  globalCooldownSec?: number;
  class?: string;

  /**
   * If false, ActionBar will NOT page itself.
   * Instead, it will call onSwipePage(dir).
   */
  enableSwipePaging?: boolean;
  suppressTaps?: boolean;
  onSwipePage?: (dir: -1 | 1) => void;
}) => {
  const actions = useMemo(() => props.actions ?? [], [props.actions]);

  const rtRef = useRef<Record<string, ActionRuntime>>({});
  const [tick, setTick] = useState(0);

  // internal page (used only when enableSwipePaging !== false)
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(actions.length / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick(nowMs());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const globalLastRef = useRef(0);

  function getRT(id: string): ActionRuntime {
    const m = rtRef.current;
    if (!m[id]) m[id] = { toggled: false, lastUsedAt: 0, lastGlobalAt: 0 };
    return m[id];
  }

  function tryUse(a: ActionDef) {
    const t = tick || nowMs();
    if (!a?.id) return;
    if (a.id.startsWith("empty-")) return;

    const gSec = props.globalCooldownSec ?? a.globalCooldown ?? 0;
    if (gSec > 0 && !canUse(globalLastRef.current, gSec, t)) return;

    const sec = a.cooldown ?? 0;
    const rt = getRT(a.id);
    if (sec > 0 && !canUse(rt.lastUsedAt, sec, t)) return;

    rt.lastUsedAt = t;
    if (gSec > 0) globalLastRef.current = t;

    props.onUse(a.id);
  }

  function toggle(a: ActionDef) {
    if (!a?.id) return;
    if (a.id.startsWith("empty-")) return;

    const rt = getRT(a.id);
    rt.toggled = !rt.toggled;
    props.onToggle?.(a.id, rt.toggled);
    setTick(nowMs());
  }

  // ----- press handling (tap vs long-press, + swipe) -----
  const pressRef = useRef<{
    id: string;
    timer: any;
    longFired: boolean;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  function getXY(e: any) {
    const x = Number(e?.clientX ?? e?.position?.x ?? 0);
    const y = Number(e?.clientY ?? e?.position?.y ?? 0);
    return { x, y };
  }

  function onDown(a: ActionDef, e: any) {
    if (!a?.id) return;
    if (a.id.startsWith("empty-")) return;

    const { x: sx, y: sy } = getXY(e);

    const timer = setTimeout(() => {
      toggle(a);
      if (pressRef.current) pressRef.current.longFired = true;
    }, 450);

    pressRef.current = {
      id: a.id,
      timer,
      longFired: false,
      startX: sx,
      startY: sy,
      moved: false,
    };
  }

  function onMove(e: any) {
    const p = pressRef.current;
    if (!p) return;

    const { x, y } = getXY(e);
    const dx = x - p.startX;
    const dy = y - p.startY;

    if (!p.moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      p.moved = true;
      clearTimeout(p.timer);
    }
  }

  function onUp(a: ActionDef, e: any) {
    const p = pressRef.current;
    if (!p || p.id !== a.id) return;

    clearTimeout(p.timer);

    const { x } = getXY(e);
    const dx = x - p.startX;

    const wasLong = p.longFired;
    const moved = p.moved;

    pressRef.current = null;

    // Swipe paging
    if (moved && Math.abs(dx) >= SWIPE_PX) {
      const dir = dx < 0 ? (1 as const) : (-1 as const);

      // external paging (used by swiper)
      if (props.enableSwipePaging === false) {
        props.onSwipePage?.(dir);
        return;
      }

      // internal paging (original behavior)
      if (pageCount > 1) {
        if (dir === 1) setPage((v) => Math.min(pageCount - 1, v + 1));
        else setPage((v) => Math.max(0, v - 1));
        return;
      }
    }

    // Tap use (only if not long press)
    if (!wasLong && !props.suppressTaps) tryUse(a);
  }

  function onCancel() {
    const p = pressRef.current;
    if (!p) return;
    clearTimeout(p.timer);
    pressRef.current = null;
  }

  const pageActions = useMemo(() => {
    // if external paging is disabled, show all actions as-is
    if (props.enableSwipePaging === false) return actions;

    const start = page * PAGE_SIZE;
    return actions.slice(start, start + PAGE_SIZE);
  }, [actions, page, props.enableSwipePaging]);

  return (
    <Wrap class={props.class ?? ""}>
      <Column onPointerMove={onMove as any}>
        <Row>
          {pageActions.map((a, i) => {
            const rt = getRT(a.id);
            const t = tick || nowMs();

            const coolSec = a.cooldown ?? 0;
            const gSec = props.globalCooldownSec ?? a.globalCooldown ?? 0;

            const remainingFrac =
              coolSec > 0 ? computeFrac(rt.lastUsedAt, coolSec, t) : 0;
            const elapsedFrac = coolSec > 0 ? 1 - remainingFrac : 0;

            const remainingGlobalFrac =
              gSec > 0 ? computeFrac(globalLastRef.current, gSec, t) : 0;
            const globalElapsedFrac = gSec > 0 ? 1 - remainingGlobalFrac : 0;

            const remaining =
              coolSec > 0
                ? Math.max(0, coolSec - (t - rt.lastUsedAt) / 1000)
                : 0;
            const isCooling = coolSec > 0 && remaining > 0;

            const isLast = i === pageActions.length - 1;

            return (
              <SlotSpacer $last={isLast}>
                <ActionSlot
                  key={a.id}
                  a={a}
                  rt={rt}
                  index={i}
                  isCooling={isCooling}
                  elapsedFrac={elapsedFrac}
                  globalElapsedFrac={globalElapsedFrac}
                  remaining={remaining}
                  onPointerDown={(e) => onDown(a, e as any)}
                  onPointerUp={(e) => onUp(a, e as any)}
                  onPointerCancel={onCancel}
                />
              </SlotSpacer>
            );
          })}
        </Row>

        {/* internal dots only when ActionBar is paging itself */}
        {props.enableSwipePaging !== false && pageCount > 1 ? (
          <Dots>
            {Array.from({ length: pageCount }).map((_, i) => {
              const isLast = i === pageCount - 1;
              return (
                <DotWrap $last={isLast}>
                  <Dot
                    style={{
                      backgroundColor:
                        i === page
                          ? "rgb(214,200,78)"
                          : "rgba(255,255,255,0.25)",
                    }}
                    onPointerDown={() => setPage(i)}
                  />
                </DotWrap>
              );
            })}
          </Dots>
        ) : null}
      </Column>
    </Wrap>
  );
};
