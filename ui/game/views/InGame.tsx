// sigil/ui/game/views/InGame.tsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import styled from "../../../util/styled";
import { ActionBarSwiper } from "../../actions/components/ActionBarSwiper";
import { ActionGrid } from "../../actions/components/ActionGrid";
import actions from "../../../data/actions";
import bars from "../../../data/bars";
import { Hud, HudSpec } from "../components/Hud";
import { useLeaderboard } from "../state/useLeaderboard";
import {
  TopRightMenu,
  TopRightMenuItem,
  TopRightMenuSpec,
} from "../components/TopRightMenu";
import { SideDock, SideDockSpec, SideDockTabKey } from "../components/SideDock";
import { SettingsPanel } from "../components/SettingsPanel";
import { useUiZoomPercent } from "../state/useUiZoom";

declare const CS: any;

const onUseAction = (actionId: string) =>
  (globalThis as any).Arken.Bridge.emit("action", actionId);
const onUseEmote = (emoteId: string) =>
  (globalThis as any).Arken.Bridge.emit("emote", emoteId);

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Lines = styled.div`
  white-space: pre-line;
`;

const Line = styled.div<{ $last?: boolean }>`
  margin-bottom: ${(p) => (p.$last ? "0px" : "4px")};
  font-size: 18px;
  color: #fff;
`;

const SideTitle = styled.div`
  font-size: 14px;
  -unity-font-style: bold;
  color: rgb(214, 200, 78);
  margin-bottom: 10px;
`;

/** USS bold belongs in styled components (not inline style objects) */
const Emph = styled.div`
  display: inline;
  color: rgb(214, 200, 78);
  -unity-font-style: bold;
`;

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

const BarPos = styled.div`
  position: absolute;
  bottom: 5px;
  left: 50%;
  translate: -50% 0;
`;

const GridPos = styled.div`
  position: absolute;
  bottom: 30px;
  right: 30px;
`;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

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

/** Minimal game info we actually show in the side dock. */
type GameInfo = {
  timerSec?: number;
  rewardWinnerAmount?: string;
  rewardWinnerName?: string;
  rewardItemAmount?: string;
  rewardItemName?: string;
  gameMode?: string;
};

/** Adjust this if your binding is different */
function getNetworkManagerInstance(): any {
  return CS?.Arken?.Evolution?.NetworkManager?.Instance ?? null;
}

function parseRoundInfo(payload: string): GameInfo {
  const parts = (payload ?? "").split(":");
  if (parts.length < 10) return {};

  const timer = parts[0];

  // Based on your destructure indices from the old web UI.
  const gameMode = parts[22];
  const rewardItemAmount = parts[45];
  const rewardItemName = parts[46];
  const rewardWinnerAmount = parts[48];
  const rewardWinnerName = parts[49];

  const timerSec = Number(timer);
  return {
    timerSec: Number.isFinite(timerSec) ? timerSec : undefined,
    gameMode,
    rewardItemAmount,
    rewardItemName,
    rewardWinnerAmount,
    rewardWinnerName,
  };
}

function formatMMSS(totalSec?: number) {
  if (!Number.isFinite(totalSec as any)) return "00:00";
  const s0 = Math.max(0, Math.floor(totalSec as number));
  const m = Math.floor(s0 / 60);
  const s = s0 % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function () {
  const [modal, setModal] = useState<ModalKey>(null);

  // constrain zoom to 50%..150% no matter what storage returns
  const zoomRaw = useUiZoomPercent();
  const zoom = clamp(zoomRaw, 50, 150);

  const scale = zoom / 100;
  const inv = 1 / scale;

  const lb = useLeaderboard();

  // Game info driven by C# event
  const [gameInfo, setGameInfo] = useState<GameInfo>({});
  const [serverTimerSec, setServerTimerSec] = useState<number | null>(null);

  useEffect(() => {
    const nm = getNetworkManagerInstance();
    if (!nm) {
      console.log(
        "[OneJS] NetworkManager.Instance not found; round info not bound."
      );
      return;
    }

    const onRoundInfo = (payload: string) => {
      const info = parseRoundInfo(payload);

      setGameInfo((prev) => ({ ...prev, ...info }));

      if (typeof info.timerSec === "number") {
        setServerTimerSec(info.timerSec); // authoritative reset
      }
    };

    // exact same subscription style as leaderboard
    if (typeof nm.add_OnSetRoundInfo === "function") {
      nm.add_OnSetRoundInfo(onRoundInfo);
      return () => {
        nm.remove_OnSetRoundInfo?.(onRoundInfo);
      };
    }

    console.log(
      "[OneJS] Warning: add_OnSetRoundInfo missing; round info event not bound."
    );
    return;
  }, []);

  const [displayTimerSec, setDisplayTimerSec] = useState<number | null>(null);

  useEffect(() => {
    // Whenever server updates timer, snap display timer
    setDisplayTimerSec(serverTimerSec);
  }, [serverTimerSec]);

  useEffect(() => {
    if (displayTimerSec == null) return;

    const id = setInterval(() => {
      setDisplayTimerSec((prev) => {
        if (prev == null) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [displayTimerSec != null]);

  const hudSpec: HudSpec = useMemo(
    () => ({
      timeLeftText: formatMMSS(displayTimerSec ?? undefined),
      rewardText: `${gameInfo.rewardItemAmount || "—"} ${
        gameInfo.rewardItemName || ""
      }`.trim(),
      rows: lb,
    }),
    [lb, displayTimerSec, gameInfo.rewardItemAmount, gameInfo.rewardItemName]
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
      {
        key: "Settings",
        label: "Settings",
        icon: "/evolution/images/settings.png",
      },
      { key: "Craft", label: "Craft", icon: "/evolution/images/craft.png" },
      { key: "Guild", label: "Guild", icon: "/evolution/images/guild.png" },
      { key: "Party", label: "Party", icon: "/evolution/images/party.png" },
      { key: "PVP", label: "PVP", icon: "/evolution/images/pvp.png" },
      {
        key: "Leaderboard",
        label: "Leaderboard",
        icon: "/evolution/images/leaderboard.png",
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

  function openModal(k: string) {
    setModal(k as ModalKey);
  }

  const sideDockSpec: SideDockSpec = useMemo(
    () => ({
      tabs: [
        { key: "quest", icon: "/evolution/images/quest.png" },
        { key: "party", icon: "/evolution/images/party.png" },
        { key: "game", icon: "/evolution/images/target.png" },
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
                  <Emph>{m.name}</Emph> (Lv {m.level})
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
                  <Emph>{q.title}</Emph>
                </Line>
                <Line $last={true}>Progress: {q.progress}</Line>
              </Lines>
            </div>
          ))}
        </div>
      );
    }

    // game tab
    return (
      <div>
        <SideTitle>GAME MODE</SideTitle>

        {!gameInfo?.gameMode ? (
          <Lines>
            <Line>Loading...</Line>
          </Lines>
        ) : (
          <Lines>
            <Line>{gameInfo.gameMode.toUpperCase()}</Line>
          </Lines>
        )}
      </div>
    );
  }

  return (
    <Wrapper
      style={
        {
          transform: `scale(${scale})`,
          transformOrigin: "0px 0px",
          width: `${inv * 100}%`,
          height: `${inv * 100}%`,
        } as any
      }
    >
      <BarPos>
        <ActionBarSwiper
          onUse={onUseAction}
          globalCooldownSec={1}
          bars={bars}
        />
      </BarPos>

      <GridPos>
        <ActionGrid actions={actions} onUse={onUseEmote} />
      </GridPos>

      <Hud spec={hudSpec} />

      <TopRightMenu spec={menuSpec} onSelect={openModal} />

      <SideDock spec={sideDockSpec} renderContent={renderSideDockContent} />

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
              {modal === "Settings" ? (
                <SettingsPanel />
              ) : (
                <Lines>
                  <Line>Dummy content for {modal}.</Line>
                  <Line $last={true}>
                    Later: wire this to your real views (Market, Inventory,
                    Settings, etc).
                  </Line>
                </Lines>
              )}
            </ModalBody>
          </ModalCard>
        </ModalShade>
      ) : null}
    </Wrapper>
  );
}
