// sigil/ui/game/views/InGame.tsx
import { h } from "preact";
import { useMemo, useState } from "preact/hooks";
import styled from "../../../util/styled";
import { ActionBarSwiper } from "../../actions/components/ActionBarSwiper";
import { ActionGrid } from "../../actions/components/ActionGrid";
import actions from "../../../data/actions";
import bars from "../../../data/bars";
import { Hud, HudSpec } from "../components/Hud";
import {
  TopRightMenu,
  TopRightMenuItem,
  TopRightMenuSpec,
} from "../components/TopRightMenu";
import { SideDock, SideDockSpec, SideDockTabKey } from "../components/SideDock";

const onUseAction = (actionId: string) =>
  (globalThis as any).Arken.Bridge.emit("action", actionId);
const onUseEmote = (emoteId: string) =>
  (globalThis as any).Arken.Bridge.emit("emote", emoteId);

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

/* --- shared --- */
const Lines = styled.div`
  white-space: pre-line;
`;

const Line = styled.div<{ $last?: boolean }>`
  margin-bottom: ${(p) => (p.$last ? "0px" : "4px")};
`;

/* local title styles used inside side content */
const SideTitle = styled.div`
  font-size: 14px;
  -unity-font-style: bold;
  color: rgb(214, 200, 78);
  margin-bottom: 10px;
`;

/* --- SIMPLE MODAL (dummy) --- */
const ModalShade = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  background-color: rgba(0, 0, 0, 0.65);
`;

const ModalCard = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  width: 560px;

  background-color: rgba(0, 0, 0, 0.92);
  border-width: 2px;
  border-color: rgb(214, 200, 78);
  border-radius: 12px;
  padding: 14px;
`;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const ModalTitle = styled.div`
  font-size: 16px;
  -unity-font-style: bold;
  color: rgb(214, 200, 78);
`;

const ModalClose = styled.div`
  padding: 6px 10px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  -unity-font-style: bold;
`;

const ModalBody = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
`;

/* --- BOTTOM UI POSITIONS --- */
const BarPos = styled.div`
  position: absolute;
  bottom: 80px;
  left: 50%;
  translate: -50% 0;
`;

const GridPos = styled.div`
  position: absolute;
  bottom: 80px;
  right: 16px;
`;

/* --- local types for mock data --- */
type ModalKey =
  | null
  | "Events"
  | "Chest"
  | "Inventory"
  | "Market"
  | "Craft"
  | "Guild"
  | "Party"
  | "PVP"
  | "Leaderboard"
  | "Settings";

export default function () {
  const [modal, setModal] = useState<ModalKey>(null);

  const hudSpec: HudSpec = useMemo(
    () => ({
      timeLeftText: "0:54",
      rewardText: "0.001 ZOD",
      rows: [
        {
          player: "Zoey",
          rank: "#1",
          kills: 1,
          deaths: 0,
          evolves: 391,
          items: 0,
          sprites: 806,
          points: 10811,
          ping: "111MS",
        },
        {
          player: "Loffarn2",
          rank: "#2",
          kills: 0,
          deaths: 0,
          evolves: 222,
          items: 0,
          sprites: 222,
          points: 10111,
          ping: "190MS",
        },
      ],
    }),
    []
  );

  const menuItems: TopRightMenuItem[] = useMemo(
    () => [
      { key: "Events", label: "Events", icon: "/evolution/images/events.png" },
      { key: "Chest", label: "Chest", icon: "/evolution/images/chest.png" },
      {
        key: "Inventory",
        label: "Inventory",
        icon: "/evolution/images/inventory.png",
      },
      { key: "Market", label: "Market", icon: "/evolution/images/market.png" },
      { key: "Craft", label: "Craft", icon: "/evolution/images/craft.png" },
      { key: "Guild", label: "Guild", icon: "/evolution/images/guild.png" },
      { key: "Party", label: "Party", icon: "/evolution/images/party.png" },
      { key: "PVP", label: "PVP", icon: "/evolution/images/pvp.png" },
      {
        key: "Leaderboard",
        label: "Leaderboard",
        icon: "/evolution/images/leaderboard.png",
      },
      {
        key: "Settings",
        label: "Settings",
        icon: "/evolution/images/settings.png",
      },
    ],
    []
  );

  const menuSpec: TopRightMenuSpec = useMemo(
    () => ({
      items: menuItems,
      mobileHandleIcon: "/evolution/images/arrow_left.png",
    }),
    [menuItems]
  );

  const partyMembers = useMemo(
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
    ],
    []
  );

  const quests = useMemo(
    () => [
      { title: "Win 1 round", progress: "0 / 1" },
      { title: "Collect 250 sprites", progress: "88 / 250" },
      { title: "Open 1 chest", progress: "0 / 1" },
    ],
    []
  );

  const targets = useMemo(
    () => [
      { name: "Enemy#5521", threat: "High", lastSeen: "Mid lane" },
      { name: "Enemy#1932", threat: "Med", lastSeen: "Top lane" },
    ],
    []
  );

  function openModal(k: string) {
    setModal(k as ModalKey);
  }

  const sideDockSpec: SideDockSpec = useMemo(
    () => ({
      tabs: [
        { key: "quest", icon: "/evolution/images/quest.png" },
        { key: "party", icon: "/evolution/images/party.png" },
        { key: "target", icon: "/evolution/images/target.png" },
      ],
      initialTabKey: "party",
      mobileHandleIcon: "/evolution/images/arrow_left.png",
      mobilePanelWidthPx: 420,
    }),
    []
  );

  function renderSideDockContent(active: SideDockTabKey) {
    if (active === "party") {
      return (
        <div>
          <SideTitle>PARTY</SideTitle>
          {partyMembers.map((m, idx) => (
            <div
              style={{
                marginBottom: idx === partyMembers.length - 1 ? "0px" : "10px",
              }}
            >
              <Lines>
                <Line>
                  <div
                    style={
                      {
                        color: "rgb(214, 200, 78)",
                        "-unity-font-style": "bold",
                      } as any
                    }
                  >
                    {m.name}
                  </div>{" "}
                  (Lv {m.level})
                </Line>
                <Line>Power: {m.power}</Line>
                <Line $last={true}>
                  {m.area} • {m.channel}
                </Line>
              </Lines>
            </div>
          ))}
        </div>
      );
    }

    if (active === "quest") {
      return (
        <div>
          <SideTitle>QUESTS</SideTitle>
          {quests.map((q, idx) => (
            <div
              style={{
                marginBottom: idx === quests.length - 1 ? "0px" : "10px",
              }}
            >
              <Lines>
                <Line>
                  <div
                    style={
                      {
                        color: "rgb(214, 200, 78)",
                        "-unity-font-style": "bold",
                      } as any
                    }
                  >
                    {q.title}
                  </div>
                </Line>
                <Line $last={true}>Progress: {q.progress}</Line>
              </Lines>
            </div>
          ))}
        </div>
      );
    }

    // targets
    return (
      <div>
        <SideTitle>TARGETS</SideTitle>
        {targets.map((t, idx) => (
          <div
            style={{
              marginBottom: idx === targets.length - 1 ? "0px" : "10px",
            }}
          >
            <Lines>
              <Line>
                <div
                  style={
                    {
                      color: "rgb(214, 200, 78)",
                      "-unity-font-style": "bold",
                    } as any
                  }
                >
                  {t.name}
                </div>
              </Line>
              <Line>Threat: {t.threat}</Line>
              <Line $last={true}>Last seen: {t.lastSeen}</Line>
            </Lines>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Wrapper>
      {/* BOTTOM CENTER: Action bar swiper */}
      <BarPos>
        <ActionBarSwiper
          onUse={onUseAction}
          globalCooldownSec={1}
          bars={bars}
        />
      </BarPos>

      {/* BOTTOM RIGHT: emote grid */}
      <GridPos>
        <ActionGrid actions={actions} onUse={onUseEmote} />
      </GridPos>

      {/* TOP LEFT HUD */}
      <Hud spec={hudSpec} />

      {/* TOP RIGHT MENU */}
      <TopRightMenu spec={menuSpec} onSelect={openModal} />

      {/* RIGHT SIDE DOCK (responsive) */}
      <SideDock spec={sideDockSpec} renderContent={renderSideDockContent} />

      {/* DUMMY MODAL */}
      {modal ? (
        <ModalShade onPointerDown={() => setModal(null)}>
          <ModalCard
            onPointerDown={(e) => {
              (e as any)?.StopPropagation?.();
            }}
          >
            <ModalHeader>
              <ModalTitle>{modal}</ModalTitle>
              <ModalClose onPointerDown={() => setModal(null)}>
                Close
              </ModalClose>
            </ModalHeader>

            <ModalBody>
              <Lines>
                <Line>Dummy content for {modal}.</Line>
                <Line $last={true}>
                  Later: wire this to your real views (Market, Inventory,
                  Settings, etc).
                </Line>
              </Lines>
            </ModalBody>
          </ModalCard>
        </ModalShade>
      ) : null}
    </Wrapper>
  );
}
