// sigil/ui/core/components/Slider.tsx
import { h } from "preact";
import { Dom } from "OneJS/Dom";
import { math } from "Unity/Mathematics";
import { useCallback, useEffect, useRef } from "preact/hooks";
import styled from "../../../util/styled";
import {
  IPointerEvent,
  PointerDownEvent,
  PointerMoveEvent,
  PointerUpEvent,
} from "UnityEngine/UIElements";

function hasPointerCapture(
  e: CS.UnityEngine.UIElements.IEventHandler,
  pointerId: number
) {
  return CS.UnityEngine.UIElements.PointerCaptureHelper.HasPointerCapture(
    e,
    pointerId
  );
}

function capturePointer(
  e: CS.UnityEngine.UIElements.IEventHandler,
  pointerId: number
) {
  CS.UnityEngine.UIElements.PointerCaptureHelper.CapturePointer(e, pointerId);
}

function releasePointer(
  e: CS.UnityEngine.UIElements.IEventHandler,
  pointerId: number
) {
  CS.UnityEngine.UIElements.PointerCaptureHelper.ReleasePointer(e, pointerId);
}

const Root = styled.div`
  height: 32px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Track = styled.div`
  position: relative;
  width: 100%;
  height: 10px;

  background-color: rgba(255, 255, 255, 0.22);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.16);
  border-radius: 6px;
`;

const Active = styled.div`
  position: relative;
  height: 10px;
  width: 0%;

  background-color: rgb(214, 200, 78);
  border-radius: 6px;
`;

const Thumb = styled.div`
  position: absolute;
  right: 0px;
  top: 50%;

  width: 18px;
  height: 18px;

  translate: 50% -50%;

  background-color: rgba(0, 0, 0, 0.65);
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
`;

export interface SliderProps extends JSX.VisualElement {
  min?: number;
  max?: number;
  value?: number;
  onChange?: (value: number) => void;

  trackStyle?: Partial<CS.OneJS.Dom.DomStyle>;
  activeTrackStyle?: Partial<CS.OneJS.Dom.DomStyle>;
  thumbStyle?: Partial<CS.OneJS.Dom.DomStyle>;
}

function safeWidth(w: any) {
  return Number.isFinite(w) && w > 0.001 ? (w as number) : 0;
}

export function Slider({
  min: _min,
  max: _max,
  value: _value,
  onChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  class: $class,
  trackStyle,
  activeTrackStyle,
  thumbStyle,
  ...props
}: SliderProps) {
  const trackRef = useRef<Dom>();
  const activeRef = useRef<Dom>();

  const min = _min ?? 0;
  const max = _max ?? 1;
  const value = _value ?? min;

  // ✅ Lower = less sensitive
  const DRAG_SENSITIVITY = 0.35;

  // drag state
  const drag = useRef({
    dragging: false,
    startX: 0,
    startRatio: 0,
    width: 0,
  });

  const setRatio = useCallback(
    (ratio: number) => {
      const r = math.saturate(ratio);

      if (activeRef.current) {
        activeRef.current.style.width = `${(r * 100).toFixed(2)}%`;
      }

      const next = math.lerp(min, max, r);
      if (!Number.isFinite(next as any)) return;

      onChange?.(next);
    },
    [min, max, onChange]
  );

  // keep visual in sync when parent changes value
  useEffect(() => {
    const ratio = math.unlerp(min, max, value);
    if (activeRef.current) {
      activeRef.current.style.width = `${(ratio * 100).toFixed(2)}%`;
    }
  }, [min, max, value]);

  // click-to-set (used on pointer down)
  const handlePointerEventAbsolute = useCallback(
    (e: IPointerEvent) => {
      const w = safeWidth(trackRef.current?.ve?.layout?.width);
      if (!w) return;

      const rawRatio = (e.localPosition.x as any) / w;
      if (!Number.isFinite(rawRatio)) return;

      setRatio(rawRatio);
    },
    [setRatio]
  );

  const handlePointerDown = useCallback(
    (e: PointerDownEvent) => {
      capturePointer(e.currentTarget, e.pointerId);

      const w = safeWidth(trackRef.current?.ve?.layout?.width);
      if (!w) return;

      // establish drag baseline
      drag.current.dragging = true;
      drag.current.startX = (e.localPosition.x as any) ?? 0;
      drag.current.startRatio = math.unlerp(min, max, value);
      drag.current.width = w;

      // optional: click-to-set immediately (keeps expected behavior)
      handlePointerEventAbsolute(e);

      onPointerDown?.(e);
    },
    [handlePointerEventAbsolute, onPointerDown, min, max, value]
  );

  const handlePointerMove = useCallback(
    (e: PointerMoveEvent) => {
      if (!hasPointerCapture(e.currentTarget, e.pointerId)) {
        onPointerMove?.(e);
        return;
      }
      if (!drag.current.dragging) {
        onPointerMove?.(e);
        return;
      }

      const w = drag.current.width;
      if (!w) return;

      const x = (e.localPosition.x as any) ?? 0;
      const dx = x - drag.current.startX;

      // ✅ delta-based drag, damped
      const deltaRatio = (dx / w) * DRAG_SENSITIVITY;
      setRatio(drag.current.startRatio + deltaRatio);

      onPointerMove?.(e);
    },
    [onPointerMove, setRatio]
  );

  const handlePointerUp = useCallback(
    (e: PointerUpEvent) => {
      drag.current.dragging = false;

      if (hasPointerCapture(e.currentTarget, e.pointerId)) {
        releasePointer(e.currentTarget, e.pointerId);
      }
      onPointerUp?.(e);
    },
    [onPointerUp]
  );

  return (
    <Root
      class={$class ?? ""}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      {...props}
    >
      <Track ref={trackRef} style={trackStyle}>
        <Active ref={activeRef} style={activeTrackStyle}>
          <Thumb style={thumbStyle} />
        </Active>
      </Track>
    </Root>
  );
}
