// sigil/ui/actions/components/ActionGrid.tsx
//
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ActionSlot } from "./ActionSlot";
import type { ActionDef, ActionRuntime } from "../types";
import { computeFrac, nowMs } from "../../../util";
import styled from "../../../util/styled";

const Anchor = styled.div`
  position: relative;
`;

const PopupPos = styled.div`
  position: absolute;
  right: 0px;
  bottom: 85px;
`;

const PopupPanel = styled.div`
  border-radius: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
  padding: 8px;
`;

const GridWrap = styled.div`
  display: flex;
  flex-direction: column;
`;

const GridRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const Cell = styled.div<{ $lastCol?: boolean }>`
  margin-right: ${(p) => (p.$lastCol ? "0px" : "5px")};
`;

const RowWrap = styled.div<{ $lastRow?: boolean }>`
  margin-bottom: ${(p) => (p.$lastRow ? "0px" : "5px")};
`;

export const ActionGrid = (props: {
  actions: ActionDef[];
  onUse: (id: string) => void;
  class?: string;
}) => {
  const actions = useMemo(() => props.actions.slice(0, 20), [props.actions]); // 5x4

  const rtRef = useRef<Record<string, ActionRuntime>>({});
  const [tick, setTick] = useState(0);

  const [selectedId, setSelectedId] = useState<string>(actions[0]?.id ?? "");
  const [open, setOpen] = useState(false);

  // keep selection valid if list changes
  useEffect(() => {
    if (!selectedId || !actions.find((a) => a.id === selectedId)) {
      setSelectedId(actions[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.map((a) => a.id).join("|")]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick(nowMs());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function getRT(id: string): ActionRuntime {
    const m = rtRef.current;
    if (!m[id]) m[id] = { toggled: false, lastUsedAt: 0, lastGlobalAt: 0 };
    return m[id];
  }

  const pressRef = useRef<{ timer: any; longFired: boolean } | null>(null);

  function onAnchorDown(_e: any) {
    const timer = setTimeout(() => {
      if (pressRef.current) pressRef.current.longFired = true;
      setOpen(true);
    }, 450);
    pressRef.current = { timer, longFired: false };
  }

  function onAnchorUp(_e: any) {
    const p = pressRef.current;
    if (!p) return;
    clearTimeout(p.timer);
    const wasLong = p.longFired;
    pressRef.current = null;

    if (!wasLong && selectedId) {
      props.onUse(selectedId);
    }
  }

  function onAnchorCancel() {
    const p = pressRef.current;
    if (!p) return;
    clearTimeout(p.timer);
    pressRef.current = null;
  }

  function selectFromPopup(a: ActionDef) {
    setSelectedId(a.id);
    setOpen(false);
    props.onUse(a.id);

    const rt = getRT(a.id);
    rt.lastUsedAt = tick || nowMs();
    setTick(nowMs());
  }

  const selected = actions.find((a) => a.id === selectedId) ?? actions[0];

  // build rows of 5
  const rows = useMemo(() => {
    const out: ActionDef[][] = [];
    for (let i = 0; i < actions.length; i += 5)
      out.push(actions.slice(i, i + 5));
    return out.slice(0, 4); // max 4 rows
  }, [actions]);

  return (
    <div class={props.class ?? ""}>
      <Anchor>
        {selected ? (
          <ActionSlot
            key={selected.id}
            a={selected}
            rt={getRT(selected.id)}
            index={0}
            isCooling={false}
            elapsedFrac={0}
            globalElapsedFrac={0}
            remaining={0}
            onPointerDown={onAnchorDown}
            onPointerUp={onAnchorUp}
            onPointerCancel={onAnchorCancel}
          />
        ) : null}

        {open ? (
          <PopupPos>
            <PopupPanel>
              <GridWrap>
                {rows.map((row, rIdx) => {
                  const lastRow = rIdx === rows.length - 1;
                  return (
                    <RowWrap $lastRow={lastRow}>
                      <GridRow>
                        {row.map((a, cIdx) => {
                          const lastCol = cIdx === row.length - 1;

                          const rt = getRT(a.id);
                          const t = tick || nowMs();
                          const coolSec = a.cooldown ?? 0;

                          const remainingFrac =
                            coolSec > 0
                              ? computeFrac(rt.lastUsedAt, coolSec, t)
                              : 0;
                          const elapsedFrac =
                            coolSec > 0 ? 1 - remainingFrac : 0;

                          const remaining =
                            coolSec > 0
                              ? Math.max(
                                  0,
                                  coolSec - (t - rt.lastUsedAt) / 1000
                                )
                              : 0;

                          const isCooling = coolSec > 0 && remaining > 0;

                          return (
                            <Cell $lastCol={lastCol}>
                              <ActionSlot
                                key={a.id}
                                a={a}
                                rt={rt}
                                index={rIdx * 5 + cIdx}
                                isCooling={isCooling}
                                elapsedFrac={elapsedFrac}
                                globalElapsedFrac={0}
                                remaining={remaining}
                                onPointerDown={() => {}}
                                onPointerUp={() => selectFromPopup(a)}
                                onPointerCancel={() => {}}
                              />
                            </Cell>
                          );
                        })}
                      </GridRow>
                    </RowWrap>
                  );
                })}
              </GridWrap>
            </PopupPanel>
          </PopupPos>
        ) : null}
      </Anchor>
    </div>
  );
};
