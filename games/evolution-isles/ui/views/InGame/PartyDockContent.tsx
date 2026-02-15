// sigil/ui/game/views/InGame/PartyDockContent.tsx
import { h } from "preact";
import { useMemo, useRef } from "preact/hooks";
import styled from "../../../../../util/styled";
import { Text } from "../../../../../ui/core/components/Text";
import { Tab } from "../../../../../ui/core/components/Tabs";
import { ScrollViewMode, WheelEvent } from "UnityEngine/UIElements";
import { Vector2 } from "UnityEngine";

type PartyMember = {
  name: string;
  level: number;
  power: number;
  area: string;
  channel: string;
};

function useDummyPartyMembers(): PartyMember[] {
  return useMemo(
    () => [
      {
        name: "Zoey",
        level: 12,
        power: 12340,
        area: "Mage Isles",
        channel: "CH 1",
      },
      {
        name: "Loffarn",
        level: 10,
        power: 9930,
        area: "Mage Isles",
        channel: "CH 1",
      },
      {
        name: "Kira",
        level: 9,
        power: 8811,
        area: "Mage Isles",
        channel: "CH 2",
      },
      {
        name: "King",
        level: 1,
        power: 111,
        area: "Mage Isles",
        channel: "CH 1",
      },
      {
        name: "Asmon",
        level: 100,
        power: 100000,
        area: "Mage Isles",
        channel: "CH 1",
      },
      { name: "A", level: 1, power: 1, area: "Mage Isles", channel: "CH 1" },
      { name: "B", level: 1, power: 1, area: "Mage Isles", channel: "CH 1" },
      { name: "C", level: 1, power: 1, area: "Mage Isles", channel: "CH 1" },
      { name: "D", level: 1, power: 1, area: "Mage Isles", channel: "CH 1" },
      { name: "E", level: 1, power: 1, area: "Mage Isles", channel: "CH 1" },
    ],
    [],
  );
}

const Panel = styled.div`
  width: 100%;
  height: 100%;

  /* IMPORTANT: constrain so it doesn't grow with content */
  max-height: 320px;

  padding: 5px;
  border-radius: 10px;
  background-color: rgba(20, 40, 90, 0.9);

  display: flex;
  flex-direction: column;

  /* critical for scroll areas inside flex columns */
  min-height: 0px;
`;

const TabBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;

  /* make both tabs 50/50 */
  align-items: stretch;

  border-radius: 10px;
  padding: 6px;

  /* blue gradient-ish */
  background-color: rgba(35, 90, 185, 0.95);

  /* use a real gap so no 3rd element steals width */
  column-gap: 6px;

  flex-shrink: 0;
`;

const TabButton = styled.div<{ $active?: boolean }>`
  flex: 1 1 0px;

  /* ensure it has real height even if Text doesn't stretch */
  min-height: 38px;

  padding: 10px 0px;
  border-radius: 8px;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${(p) =>
    p.$active ? "rgba(0, 0, 0, 0.22)" : "rgba(255, 255, 255, 0.08)"};

  border-width: ${(p) => (p.$active ? "1px" : "0px")};
  border-color: rgba(255, 255, 255, 0.22);
`;

const PanelBody = styled.div`
  margin-top: 6px;
  width: 100%;

  border-radius: 10px;
  padding: 12px;

  background-color: rgba(10, 25, 70, 0.7);

  /* take remaining height, not content height */
  flex: 1 1 auto;
  min-height: 0px;

  /* keep children inside */
  display: flex;
  flex-direction: column;
`;

const ScrollFill = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0px;
`;

const MemberRow = styled.div<{ $last?: boolean }>`
  width: 100%;
  border-radius: 10px;
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.2);

  margin-bottom: ${(p) => (p.$last ? "0px" : "8px")};

  /* avoid any flex "equal height" behaviors */
  flex: 0 0 auto;
`;

const MemberTop = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Meta = styled.div`
  margin-top: 4px;
`;

export function PartyDockContent() {
  const partyMembers = useDummyPartyMembers();

  // ScrollView refs (for wheel fix like your reference)
  const partyScrollRef = useRef<any>(null);
  const manageScrollRef = useRef<any>(null);

  function fixWheelScroll(ref: any, evt: WheelEvent) {
    try {
      const sv = ref?.current?.ve as any; // UITK ScrollView
      if (!sv) return;

      const scroller = sv.verticalScroller;
      if (scroller && scroller.highValue > 0) {
        const speed = 0.01;
        sv.scrollOffset = new Vector2(
          0,
          sv.scrollOffset.y + 1000 * (evt.delta.y * speed),
        );
        evt.StopPropagation?.();
      }
    } catch {
      // ignore if environment differs
    }
  }

  return (
    <Panel>
      <Tab.Group defaultIndex={0}>
        <Tab.List>
          <TabBar>
            <Tab
              name="Party"
              index={0}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
            >
              {({ selected }) => (
                <TabButton $active={selected}>
                  <Text size={16} bold color="#fff">
                    Party
                  </Text>
                </TabButton>
              )}
            </Tab>

            <Tab
              name="Manage"
              index={1}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
            >
              {({ selected }) => (
                <TabButton $active={selected}>
                  <Text size={16} bold color="#fff">
                    Manage
                  </Text>
                </TabButton>
              )}
            </Tab>
          </TabBar>
        </Tab.List>

        <Tab.Panels style={{ marginTop: "40px" }}>
          <Tab.Panel>
            <PanelBody>
              <ScrollFill>
                <scrollview
                  class="w-full h-full"
                  mode={ScrollViewMode.Vertical}
                  ref={partyScrollRef}
                  onWheel={(e) => fixWheelScroll(partyScrollRef, e as any)}
                >
                  <div class="w-full flex-col">
                    {partyMembers.length ? (
                      partyMembers.map((m, idx) => (
                        <MemberRow
                          key={`${m.name}-${idx}`}
                          $last={idx === partyMembers.length - 1}
                        >
                          <MemberTop>
                            <Text size={18} bold color="#fff">
                              {m.name}
                            </Text>
                            <Text size={16} color="rgba(255,255,255,0.85)">
                              Lv {m.level}
                            </Text>
                          </MemberTop>

                          <Meta>
                            <Text size={14} color="rgba(255,255,255,0.9)">
                              Power: {m.power}
                            </Text>
                          </Meta>

                          <Meta>
                            <Text size={14} color="rgba(255,255,255,0.9)">
                              {m.area} • {m.channel}
                            </Text>
                          </Meta>
                        </MemberRow>
                      ))
                    ) : (
                      <Text size={14} color="rgba(255,255,255,0.9)">
                        No party members.
                      </Text>
                    )}
                  </div>
                </scrollview>
              </ScrollFill>
            </PanelBody>
          </Tab.Panel>

          <Tab.Panel>
            <PanelBody>
              <ScrollFill>
                <scrollview
                  class="w-full h-full"
                  mode={ScrollViewMode.Vertical}
                  ref={manageScrollRef}
                  onWheel={(e) => fixWheelScroll(manageScrollRef, e as any)}
                >
                  <div class="w-full flex-col">
                    <Text size={16} bold color="#fff">
                      Manage Party
                    </Text>
                    <Meta>
                      <Text size={14} color="rgba(255,255,255,0.9)">
                        (TODO) Invite / Kick / Leave / Settings
                      </Text>
                    </Meta>

                    <div style={{ height: "10px" }} />

                    {/* filler so you can see scroll working */}
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div style={{ marginBottom: i === 29 ? "0px" : "6px" }}>
                        <Text size={14} color="rgba(255,255,255,0.85)">
                          Manage option {i + 1}
                        </Text>
                      </div>
                    ))}
                  </div>
                </scrollview>
              </ScrollFill>
            </PanelBody>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </Panel>
  );
}
