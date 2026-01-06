// sigil/ui/actions/components/ActionSlot.tsx
//
import { h } from "preact";
import type { ActionDef, ActionRuntime } from "../types";
import { clamp01 } from "../../../util";
import { Icon } from "../../core/components/Icon";
import styled from "../../../util/styled";

const SlotRoot = styled.div`
  outline: 2px solid red;
  position: relative;
  width: 75px;
  height: 75px;
  min-width: 75px;
  min-height: 75px;
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: 75px;
  border-radius: 10px;
  overflow: hidden;
  user-select: none;
  background-color: rgba(10, 10, 10, 1);
`;

const RingOff = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  border-radius: 10px;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
`;

const RingOn = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  border-radius: 10px;
  pointer-events: none;
  box-shadow: 0 0 0 2px rgba(214, 200, 78, 1), 0 0 12px rgba(214, 200, 78, 0.55);
`;

const Bevel = styled.div`
  position: absolute;
  top: 1px;
  left: 1px;
  right: 1px;
  bottom: 1px;
  border-radius: 9px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
  pointer-events: none;
`;

const IconFrame = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border-radius: 8px;
  overflow: hidden;
`;

const EmptyTile = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`;

const Label = styled.div`
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 12px;
  -unity-font-style: bold;
  color: rgb(214, 200, 78);
  pointer-events: none;
`;

const KeyLabel = styled(Label)`
  left: 8px;
  font-size: 14px;
`;

const Remaining = styled.div`
  position: absolute;
  bottom: 4px;
  left: 0px;
  width: 100%;
  -unity-text-align: middle-center;
  font-size: 13px;
  -unity-font-style: bold;
  color: rgb(214, 200, 78);
  pointer-events: none;
`;

export const ActionSlot = (props: {
  a: ActionDef;
  rt: ActionRuntime;
  index: number;
  isCooling: boolean;
  elapsedFrac: number;
  globalElapsedFrac: number;
  remaining: number;
  onPointerDown: (e: any) => void;
  onPointerUp: (e: any) => void;
  onPointerCancel: (e: any) => void;
}) => {
  const { a, rt, isCooling, elapsedFrac, globalElapsedFrac, remaining } = props;

  const isEmpty = a.id.startsWith("empty-") || !a.src;
  const showKey = !!a.keybind;

  const g = clamp01(globalElapsedFrac);
  const l = clamp01(elapsedFrac);

  return (
    <SlotRoot
      onPointerDown={props.onPointerDown as any}
      onPointerUp={props.onPointerUp as any}
      onPointerCancel={props.onPointerCancel as any}
    >
      {rt.toggled ? <RingOn /> : <RingOff />}
      <Bevel />

      {!isEmpty ? (
        <IconFrame>
          <Icon src={a.src} />
        </IconFrame>
      ) : (
        <EmptyTile />
      )}

      {g > 0 ? (
        <cooldownradial
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            right: "0px",
            bottom: "0px",
            width: "100%",
            height: "100%",
          }}
          frac={g as any}
          color="#000000"
          alpha={0.35 as any}
        />
      ) : null}

      {isCooling && l > 0 ? (
        <cooldownradial
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            right: "0px",
            bottom: "0px",
            width: "100%",
            height: "100%",
          }}
          frac={l as any}
          color="#000000"
          alpha={0.55 as any}
        />
      ) : null}

      {a.isSelf ? <Label>SELF</Label> : null}
      {!a.isSelf && showKey ? <KeyLabel>{a.keybind}</KeyLabel> : null}

      {isCooling && remaining > 0 ? (
        <Remaining>{remaining.toFixed(2)}</Remaining>
      ) : null}
    </SlotRoot>
  );
};
