// sigil/ui/actions/components/ActionBarSwiper.tsx
//
import { h } from "preact";
import { useState, useRef } from "preact/hooks";
import styled from "../../../util/styled";
import type { ActionDef } from "../types";
import { ActionBar } from "./ActionBar";

const DRAG_START_PX = 10;
const SWIPE_COMMIT_PX = 40;

const Wrapper = styled.div`
  position: relative;
  padding: 5px 12px 0px 12px;
`;

const Dots = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;

  margin-top: 5px;
  padding-top: 0px;

  opacity: 0.95;
`;

const DotHit = styled.div`
  width: 26px;
  height: 26px;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const DotInactive = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.28);
`;

const DotActive = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: rgb(214, 200, 78);
`;

export function ActionBarSwiper(props: {
  bars: ActionDef[][];
  onUse: (id: string) => void;
  onToggle?: (id: string, newState: boolean) => void;
  globalCooldownSec?: number;
}) {
  const bars = props.bars ?? [];
  const pageCount = Math.max(1, bars.length);
  const [page, setPage] = useState(0);

  const [suppressTaps, setSuppressTaps] = useState(false);

  const dragRef = useRef<{
    down: boolean;
    startX: number;
    dx: number;
    dragging: boolean;
  } | null>(null);

  function getX(e: any) {
    return Number(e?.clientX ?? e?.position?.x ?? 0);
  }

  function onDown(e: any) {
    const x = getX(e);
    dragRef.current = { down: true, startX: x, dx: 0, dragging: false };
  }

  function onMove(e: any) {
    const d = dragRef.current;
    if (!d || !d.down) return;

    const x = getX(e);
    const dx = x - d.startX;
    d.dx = dx;

    if (!d.dragging && Math.abs(dx) >= DRAG_START_PX) {
      d.dragging = true;
      setSuppressTaps(true);
    }
  }

  function finishDrag() {
    const d = dragRef.current;
    dragRef.current = null;

    if (!d) return;

    if (!d.dragging) {
      setSuppressTaps(false);
      return;
    }

    if (d.dx <= -SWIPE_COMMIT_PX)
      setPage((p) => Math.min(pageCount - 1, p + 1));
    else if (d.dx >= SWIPE_COMMIT_PX) setPage((p) => Math.max(0, p - 1));

    setTimeout(() => setSuppressTaps(false), 0);
  }

  const actions = bars[Math.min(page, pageCount - 1)] ?? [];

  return (
    <Wrapper
      onPointerDown={onDown as any}
      onPointerMove={onMove as any}
      onPointerUp={finishDrag as any}
      onPointerCancel={finishDrag as any}
    >
      <ActionBar
        actions={actions}
        onUse={props.onUse}
        onToggle={props.onToggle}
        globalCooldownSec={props.globalCooldownSec}
        enableSwipePaging={false}
        onSwipePage={(dir) =>
          setPage((p) => Math.min(pageCount - 1, Math.max(0, p + dir)))
        }
        suppressTaps={suppressTaps}
      />

      {pageCount > 1 ? (
        <Dots>
          {Array.from({ length: pageCount }).map((_, i) => (
            <DotHit
              onPointerDown={() => setPage(i)}
              onPointerUp={() => setPage(i)}
            >
              {i === page ? <DotActive /> : <DotInactive />}
            </DotHit>
          ))}
        </Dots>
      ) : null}
    </Wrapper>
  );
}
