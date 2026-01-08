// sigil/ui/game/views/InGame.tsx
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import styled from "../../../util/styled";
import { ActionBarSwiper } from "../../actions/components/ActionBarSwiper";
import { ActionGrid } from "../../actions/components/ActionGrid";
import actions from "../../../data/actions";
import bars from "../../../data/bars";
import { Hud, HudSpec } from "../components/Hud";
import { useLeaderboard } from "../state/useLeaderboard";
import UpgradeGrid from "../components/UpgradeGrid";
import { PartyDockContent } from "./InGame/PartyDockContent";
import { QuestDockContent } from "./InGame/QuestDockContent";
import { GameDockContent } from "./InGame/GameDockContent";
import { PickingMode } from "UnityEngine/UIElements";
import {
  ActionHub,
  ActionHubItem,
  ActionHubSpec,
} from "../components/ActionHub";
import { SideDock, SideDockSpec, SideDockTabKey } from "../components/SideDock";
import { SettingsPanel } from "../components/SettingsPanel";
import { useUiZoomPercent } from "../state/useUiZoom";
import { Text } from "../../core/components/Text";

const emitAction = (actionId: string) =>
  CS.Arken.Bridge.Instance?.Emit("action", JSON.stringify(actionId));
const emitEmote = (emoteId: string) =>
  CS.Arken.Bridge.Instance?.Emit("emote", JSON.stringify(emoteId));
const emitLoad = () =>
  CS?.Arken?.Bridge?.Instance?.Emit?.("load", JSON.stringify([]));
const emitJoin = () =>
  CS?.Arken?.Bridge?.Instance?.Emit?.("join", JSON.stringify([]));

const PartyPanel = styled.div`
  width: 100%;
  padding: 5px;

  border-radius: 10px;
  background-color: rgba(20, 40, 90, 0.9);
`;

const PartyTabs = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;

  border-radius: 10px;
  padding: 6px;

  /* “blue gradient” approximation (USS-safe) */
  background-color: rgba(35, 90, 185, 0.95);

  /* optional: slight tint filter if your UITK supports it well */
  /* filter: tint(rgba(40, 140, 255, 0.35)); */
`;

const PartyTab = styled.div<{ $active?: boolean }>`
  flex-grow: 1;
  flex-basis: 0px;

  padding: 8px 0px;
  border-radius: 8px;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${(p) =>
    p.$active ? "rgba(0, 0, 0, 0.22)" : "rgba(255, 255, 255, 0.08)"};

  border-width: ${(p) => (p.$active ? "1px" : "0px")};
  border-color: rgba(255, 255, 255, 0.22);
`;

const PartyBody = styled.div`
  margin-top: 6px;
  width: 100%;

  border-radius: 10px;
  padding: 10px;

  background-color: rgba(10, 25, 70, 0.7);

  /* scrollable content */
  max-height: 260px;
  overflow: scroll;
`;

const PartyMemberRow = styled.div`
  width: 100%;
  border-radius: 10px;
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.2);

  margin-bottom: 8px;
`;

const PartyMemberRowLast = styled(PartyMemberRow)`
  margin-bottom: 0px;
`;

const PartyMemberTop = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const PartyMemberMeta = styled.div`
  margin-top: 4px;
`;

const StatusOverlay = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: rgba(0, 0, 0, 0.35);

  /* let children decide pointer handling */
`;

const StatusCard = styled.div`
  background-color: rgba(0, 0, 0, 0.92);
  border-width: 2px;
  border-color: rgb(214, 200, 78);
  border-radius: 12px;
  padding: 14px 18px;

  display: flex;
  justify-content: center;
  align-items: center;
`;

const BottomCenter = styled.div`
  position: absolute;
  left: 50%;
  bottom: 50px;
  translate: -50% 0;

  /* must explicitly receive pointer events */
`;

const ButtonFrame = styled.div`
  background-color: rgba(0, 0, 0, 0.92);
  border-width: 2px;
  border-color: rgb(214, 200, 78);
  border-radius: 12px;
  padding: 10px;
`;

const ButtonLike = styled.div`
  width: 150px;
  padding: 10px 12px;

  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.08);

  display: flex;
  justify-content: center;
  align-items: center;

  color: rgba(255, 255, 255, 0.92);
  -unity-font-style: bold;
`;

/** Full-screen, unscaled root */
const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const UpgradeOverlay = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;

  /* no z-index in USS — ensure this node is rendered AFTER Scaled in JSX */
  display: flex;
  align-items: center;
  justify-content: center;

  background-color: rgba(0, 0, 0, 0.55);
`;

const UpgradeOverlayInner = styled.div`
  /* receives pointer events */
`;

/** Everything inside here is zoomed */
const Scaled = styled.div<{
  $scale: number;
}>`
  position: absolute;
  left: 0px;
  top: 0px;

  /* UI Toolkit: scale is a property */
  scale: ${(p) => p.$scale} ${(p) => p.$scale};
  transform-origin: 0px 0px;

  /* keep content filling the visible area after scaling */
  width: ${(p) => `${(1 / p.$scale) * 100}%`};
  height: ${(p) => `${(1 / p.$scale) * 100}%`};
`;

const Lines = styled.div`
  white-space: pre-line;
`;

// Keep Line only for spacing (Text handles font/color/shadow)
const Line = styled.div<{ $last?: boolean }>`
  margin-bottom: ${(p) => (p.$last ? "0px" : "4px")};
`;

const SideTitle = styled.div`
  margin-bottom: 10px;
`;

/** Kept for non-Text legacy usage */
const Emph = styled.div`
  display: inline;
  color: rgb(214, 200, 78);
  -unity-font-style: bold;
`;

/** IMPORTANT: ModalShade is now relative to the full-screen Wrapper, NOT scaled */
const ModalShade = styled.div`
  position: absolute; /* could be fixed if your UITK supports it */
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;

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

type UiState =
  | "none"
  | "loading"
  | "joining"
  | "joined"
  | "spectating"
  | "disconnected";

type Upgrade = {
  id: string;
  keybind: string;
  name: string;
  description: string;
  src?: string;
};

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
  const [partyTab, setPartyTab] = useState<"party" | "manage">("party");

  // state machine (from old web impl)
  const state = useRef<UiState>("none");
  const [uiState, setUiState] = useState<UiState>("none");
  function setState(next: UiState) {
    state.current = next;
    setUiState(next);
  }

  // constrain zoom to 50%..150% no matter what storage returns
  const zoomRaw = useUiZoomPercent();
  const zoom = clamp(zoomRaw, 50, 150);
  const scale = zoom / 100;

  const lb = useLeaderboard();

  // Game info driven by C# event
  const [gameInfo, setGameInfo] = useState<GameInfo>({});
  const [serverTimerSec, setServerTimerSec] = useState<number | null>(null);

  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);

  useEffect(() => {
    const bridge = CS?.Arken?.Bridge?.Instance;
    if (!bridge) {
      console.log(
        "[OneJS] NetworkManager.Instance not found; events not bound."
      );
      return;
    }

    const onServerEvent = (eventName: string, args: string) => {
      // ---- state transitions ----
      if (eventName === "onLoaded") {
        setState("loading");
        return;
      }

      if (eventName === "onLogin") {
        setState("joining");
        return;
      }

      if (eventName === "onJoinGame") {
        setState("joined");
        return;
      }

      if (eventName === "onSpectate" || eventName === "onGameOver") {
        setState("spectating");
        return;
      }

      if (eventName === "onDisconnected") {
        setState("disconnected");
        return;
      }

      // ---- data events ----
      if (eventName === "onSetRoundInfo") {
        const info = parseRoundInfo(args);

        setGameInfo((prev) => ({ ...prev, ...info }));

        if (typeof info.timerSec === "number") {
          setServerTimerSec(info.timerSec); // authoritative reset
        }
        return;
      }

      if (eventName === "onUpgrade") {
        /**
         * Old payload format:
         * updatesPending:rerolls,upgradeId1,upgradeId2,upgradeId3
         */
        try {
          const parts = args.split(",");
          const upgradeId1 = parts[1];
          const upgradeId2 = parts[2];
          const upgradeId3 = parts[3];

          // TODO: replace with server-driven data later
          setUpgrades([
            {
              id: upgradeId1,
              keybind: "1",
              name: "BLM Shield",
              description:
                "Chaotic fire surrounds you for 10 seconds. You feel compelled to burn it all down.",
              src: "/images/skills/200.png",
            },
            {
              id: upgradeId2,
              keybind: "2",
              name: "Montana Speed",
              description: "Gain +30% speed for 5 seconds.",
              src: "/images/skills/201.png",
            },
            {
              id: upgradeId3,
              keybind: "3",
              name: "Forrest Bump's Blessing",
              description: "Gain +10% speed for 30 seconds.",
              src: "/images/skills/202.png",
            },
          ]);

          setIsUpgradeOpen(true);
        } catch (e) {
          console.warn("[Upgrade] Failed to parse onUpgrade payload", args);
        }

        return;
      }
    };

    if (typeof bridge.add_OnServerEvent === "function") {
      bridge.add_OnServerEvent(onServerEvent);
      return () => {
        bridge.remove_OnServerEvent?.(onServerEvent);
      };
    }

    console.log(
      "[OneJS] Warning: add_OnServerEvent missing; server events not bound."
    );
    return;
  }, []);

  const [displayTimerSec, setDisplayTimerSec] = useState<number | null>(null);

  useEffect(() => {
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

  const menuItems: ActionHubItem[] = useMemo(
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

  const menuSpec: ActionHubSpec = useMemo(
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
      {
        name: "A",
        level: 1,
        power: 1,
        area: "Mage Isles",
        channel: "CH 1",
      },
      {
        name: "B",
        level: 1,
        power: 1,
        area: "Mage Isles",
        channel: "CH 1",
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
      initialTabKey: "game",
      mobileHandleIcon: "/evolution/images/arrow_left.png",
      mobilePanelWidthPx: 390,
    }),
    []
  );

  function renderSideDockContent(active: SideDockTabKey) {
    if (active === "party") return <PartyDockContent />;
    if (active === "quest") return <QuestDockContent />;
    return <GameDockContent gameMode={gameInfo?.gameMode} />;
  }

  return (
    <Wrapper>
      {state.current === "joined" ? (
        <Scaled $scale={scale}>
          <BarPos>
            <ActionBarSwiper
              onUse={emitAction}
              globalCooldownSec={1}
              bars={bars}
            />
          </BarPos>

          <GridPos>
            <ActionGrid actions={actions} onUse={emitEmote} />
          </GridPos>

          <Hud spec={hudSpec} />

          <ActionHub spec={menuSpec} onSelect={openModal} />

          <SideDock spec={sideDockSpec} renderContent={renderSideDockContent} />
        </Scaled>
      ) : null}

      {state.current === "spectating" && isUpgradeOpen ? (
        <UpgradeOverlay picking-mode={PickingMode.Position}>
          <UpgradeOverlayInner picking-mode={PickingMode.Position}>
            <UpgradeGrid
              upgrades={upgrades}
              onUse={(upgradeId) => {
                setIsUpgradeOpen(false);
                CS.Arken.Bridge.Instance.Emit(
                  "chooseUpgrade",
                  JSON.stringify(upgradeId)
                );
              }}
            />
          </UpgradeOverlayInner>
        </UpgradeOverlay>
      ) : null}

      {state.current === "none" || state.current === "loading" ? (
        <StatusOverlay picking-mode={PickingMode.Position}>
          <BottomCenter picking-mode={PickingMode.Position}>
            <StatusCard picking-mode={PickingMode.Position}>
              <Text size={22} bold color="rgb(214, 200, 78)">
                Connecting
              </Text>
            </StatusCard>
          </BottomCenter>
        </StatusOverlay>
      ) : null}

      {state.current === "spectating" ? (
        <BottomCenter picking-mode={PickingMode.Position}>
          <ButtonFrame picking-mode={PickingMode.Position}>
            <ButtonLike
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={emitLoad}
            >
              Revive
            </ButtonLike>
          </ButtonFrame>
        </BottomCenter>
      ) : null}

      {state.current === "disconnected" ? (
        <BottomCenter picking-mode={PickingMode.Position}>
          <ButtonFrame picking-mode={PickingMode.Position}>
            <ButtonLike
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={emitJoin}
            >
              Reconnect
            </ButtonLike>
          </ButtonFrame>
        </BottomCenter>
      ) : null}

      {/* ✅ Modal is NOT scaled, so it always covers the full screen */}
      {modal ? (
        <ModalShade onPointerDown={() => setModal(null)}>
          <ModalCard
            onPointerDown={(e) => {
              (e as any)?.StopPropagation?.();
            }}
          >
            <ModalHeader>
              <ModalTitle>{modal}</ModalTitle>
              <ModalClose onPointerDown={() => setModal(null)}>X</ModalClose>
            </ModalHeader>

            <ModalBody>
              {modal === "Market" ? (
                <SettingsPanel />
              ) : (
                <Lines>
                  <Line>
                    <Text shadow size={18} color="#fff">
                      Dummy content for {modal}.
                    </Text>
                  </Line>
                  <Line $last={true}>
                    <Text shadow size={18} color="#fff">
                      Later: wire this to your real views (Market, Inventory,
                      Settings, etc).
                    </Text>
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
