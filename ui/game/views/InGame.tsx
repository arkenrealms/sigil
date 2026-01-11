// sigil/ui/game/views/InGame.tsx
import { h, Fragment } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import styled from "../../../util/styled";
import { ActionBarSwiper } from "../../actions/components/ActionBarSwiper";
import { ActionGrid } from "../../actions/components/ActionGrid";
import actions from "../../../data/actions";
import bars from "../../../data/bars";
import { Hud, HudSpec } from "../components/Hud";
import { Icon } from "../../core/components/Icon";
import { useLeaderboard } from "../state/useLeaderboard";
import {
  loadPrefsJson,
  savePrefsJson,
  clearPrefs,
} from "../../core/state/persist";
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
const showLogin = () => CS?.Arken?.Bridge?.Instance?.ShowWeb("/login");
const showInbox = () => CS?.Arken?.Bridge?.Instance?.ShowWeb("/inbox");
const showSkills = () => CS?.Arken?.Bridge?.Instance?.ShowWeb("/skills");

type PersistedInGame = {
  roundId: string;
  serverState: ServerState;
  webState: WebState;
  gameInfo: GameInfo;
  serverTimerSec: number | null;
  reward: Reward | null;
};

const PREF_KEY = "sigil.ingame.cache.v1";
const PREF_TTL_MS = 300_000;

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
  background-color: #11111d;
  border-width: 2px;
  border-color: #b59766;
  border-radius: 12px;
  padding: 14px 18px;

  display: flex;
  justify-content: center;
  align-items: center;
`;

const BottomLeft = styled.div`
  position: absolute;
  left: 20px;
  bottom: 120px;
  translate: 0 0;
`;

const BottomRight = styled.div`
  position: absolute;
  right: 20px;
  bottom: 120px;
  translate: 0 0;
`;

const BottomDock = styled.div`
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: -10px;

  display: flex;
  justify-content: center;

  /* keeps it above anything behind it */
  pointer-events: auto;
`;

const Bottom = styled.div`
  width: 100%;
  max-width: 600px;
  height: 120px;

  display: flex;
  flex-direction: row;
  align-items: stretch;

  border-width: 2px;
  border-color: #b59766;
  border-radius: 15px;
  background-color: #11111d;

  overflow: hidden; /* makes rounded corners clip children nicely */
`;

const BottomCenter = styled.div`
  position: absolute;
  left: 50%;
  bottom: 150px;
  translate: -50% 0;
`;

const ButtonFrame = styled.div`
  background-color: #11111d;
  border-width: 2px;
  border-color: #b59766;
  border-radius: 12px;
  padding: 10px;
`;

const Button = styled.div`
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

  background-color: rgba(0, 0, 0, 0.65);
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

  background-color: #11111d;
  border-width: 2px;
  border-color: #b59766;
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
  color: #b59766;
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

const ActionBarPos = styled.div`
  position: absolute;
  bottom: 105px;
  left: 50%;
  translate: -50% 0;
`;

const WebStatePos = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
`;

const GridPos = styled.div`
  position: absolute;
  bottom: 30px;
  right: 30px;
`;

/** Reward (top-center) */
const RewardAnchor = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  translate: -50% 0;

  /* keep it compact + clickable later */
`;

const RewardCardOuter = styled.div`
  // border-radius: 6px;
  // padding: 1px;
  // border-color: #b59766;
`;

const RewardCard = styled.div`
  border-radius: 6px;
  padding: 10px 14px;

  background-color: rgba(0, 0, 0, 0.5);
  border-width: 0px;
  border-color: #b59766;

  display: flex;
  flex-direction: column;
  align-items: center;
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

type ServerState =
  | "none"
  | "loading"
  | "joining"
  | "joined"
  | "spectating"
  | "disconnected";

type WebState = "none" | "initializing" | "initialized" | "authorized";

const BottomMenuIconWrap = styled.div`
  width: 70px;
  height: 70px;
  margin-left: auto;
  margin-right: auto;

  display: flex;
  justify-content: center;
  align-items: center;

  position: relative;
`;

const BottomMenuItem = styled.div`
  flex: 1 1 0px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 10px 0px;

  border-left: 1px solid rgba(255, 255, 255, 0.12);
  border-right: 1px solid rgba(0, 0, 0, 0.08);

  row-gap: 6px;
`;

const BottomMenuLabel = styled.div`
  margin-top: 6px;
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  /* prevents weird vertical drift */
  line-height: 1;
`;

const Dot = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #fb201e;
  width: 15px;
  height: 15px;
  border-radius: 15px;
  border: 1px solid #a43347;
`;

type Upgrade = {
  id: string;
  keybind: string;
  name: string;
  description: string;
  src?: string;
};

type Reward = {
  id: string;
  rewardItemType?: string;
  rewardItemName: string;
  quantity: string;
  position?: { x: string; y: string };
  shortDescription?: string;
  longDescription?: string;
};

function parseRoundInfo(payload: string): GameInfo {
  const parts = (payload ?? "").split(":");
  if (parts.length < 10) return {};

  const timer = parts[0];

  // Based on your destructure indices from the old web UI.
  const gameMode = parts[22];
  const rewardItemAmount = parts[45];
  const rewardItemName = parts[46];
  const rewardWinnerAmount = parts[47];
  const rewardWinnerName = parts[48];

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

function rewardDescriptions(name: string) {
  const n = (name ?? "").toLowerCase();
  if (n === "harold") {
    return {
      shortDescription: "HAROLD token is based on the Hide The Pain meme.",
      longDescription:
        "It was rugged by the original creator and is has been adopted by the community and a very big whale.",
    };
  }
  if (n === "pepe") {
    return {
      shortDescription: "Pepe is a well known meme.",
      longDescription: "Pepe stuff",
    };
  }
  return {
    shortDescription: "DOGE is a shiba inu.",
    longDescription: "Doge stuff",
  };
}

export default function () {
  const [modal, setModal] = useState<ModalKey>(null);

  const serverState = useRef<ServerState>("none");
  const [_serverState, _setServerState] = useState<ServerState>("none");
  function setServerState(next: ServerState) {
    serverState.current = next;
    _setServerState(next);
  }

  const webState = useRef<WebState>("none");
  const [_webState, _setWebState] = useState<WebState>("none");
  function setWebState(next: WebState) {
    webState.current = next;
    _setWebState(next);
  }

  // constrain zoom to 50%..150% no matter what storage returns
  const zoomRaw = useUiZoomPercent();
  const zoom = clamp(zoomRaw, 50, 150);
  const scale = zoom / 100;

  const lb = useLeaderboard();

  // Game info driven by C# event
  const [gameInfo, setGameInfo] = useState<GameInfo>({});
  const [serverTimerSec, setServerTimerSec] = useState<number | null>(null);

  // Reward popup driven by onSpawnReward / onUpdateReward
  const [reward, setReward] = useState<Reward | null>(null);

  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);

  // ✅ round id (derived from onSetRoundInfo)
  const [roundId, setRoundId] = useState<string>("");

  // ✅ keep cached payload around until we can validate with roundId
  const cachedRef = useRef<PersistedInGame | null>(null);
  const hasHydratedRef = useRef(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const cached = loadPrefsJson<PersistedInGame>(PREF_KEY, PREF_TTL_MS);
    if (!cached) return;

    cachedRef.current = cached;

    serverState.current = cached.serverState;
    setServerState(cached.serverState);

    webState.current = cached.webState;
    setWebState(cached.webState);

    setGameInfo(cached.gameInfo || {});

    setServerTimerSec(
      typeof cached.serverTimerSec === "number" ? cached.serverTimerSec : null
    );
    setReward(cached.reward ?? null);

    hasHydratedRef.current = true;
  }, []);

  // 2) Once we learn the *current* roundId, validate + hydrate fully (once)
  useEffect(() => {
    if (!roundId) return;
    if (hasHydratedRef.current) return;

    const cached = cachedRef.current;
    if (!cached) {
      hasHydratedRef.current = true;
      return;
    }

    // ✅ Gate restore by roundId match
    if (cached.roundId !== roundId) {
      // stale cache from another round
      clearPrefs(PREF_KEY);
      hasHydratedRef.current = true;
      return;
    }

    // Restore fields
    serverState.current = cached.serverState;
    setServerState(cached.serverState);

    webState.current = cached.webState;
    setWebState(cached.webState);

    setGameInfo(cached.gameInfo || {});

    setServerTimerSec(
      typeof cached.serverTimerSec === "number" ? cached.serverTimerSec : null
    );
    setReward(cached.reward ?? null);

    hasHydratedRef.current = true;
  }, [roundId]);

  // 3) Persist (only when we have a roundId)
  useEffect(() => {
    if (!roundId) return;
    const payload: PersistedInGame = {
      roundId,
      serverState: _serverState,
      webState: _webState,
      gameInfo,
      serverTimerSec,
      reward,
    };
    savePrefsJson(PREF_KEY, payload);
  }, [roundId, _serverState, _webState, gameInfo, serverTimerSec, reward]);

  useEffect(() => {
    const bridge = CS?.Arken?.Bridge?.Instance;
    if (!bridge) {
      console.log("[OneJS] Bridge.Instance not found; events not bound.");
      return;
    }

    const onServerEvent = (eventName: string, args: string) => {
      // ---- serverState transitions ----
      if (eventName === "onLoaded") {
        setServerState("loading");
        return;
      }

      if (eventName === "onLogin") {
        setServerState("joining");
        return;
      }

      if (eventName === "onJoinGame") {
        setServerState("joined");
        return;
      }

      if (eventName === "onSpectate" || eventName === "onGameOver") {
        setServerState("spectating");
        return;
      }

      if (eventName === "onDisconnected") {
        setServerState("disconnected");
        setReward(null);
        clearPrefs(PREF_KEY);
        return;
      }

      // ---- reward events (old web UI parity) ----
      if (eventName === "onSpawnReward") {
        // old format: id:type:name:qty:x:y
        const data = (args ?? "").split(":");
        const id = data[0] ?? "";
        const rewardItemType = data[1] ?? "";
        const rewardItemName = data[2] ?? "";
        const quantity = data[3] ?? "";
        const x = data[4] ?? "";
        const y = data[5] ?? "";

        const desc = rewardDescriptions(rewardItemName);

        setReward({
          id,
          rewardItemType,
          rewardItemName,
          quantity,
          position: { x, y },
          ...desc,
        });
        return;
      }

      if (eventName === "onUpdateReward") {
        // old web UI: clear reward when updated/claimed
        setReward(null);
        return;
      }

      // ---- data events ----
      if (eventName === "onSetRoundInfo") {
        // IMPORTANT: derive a stable roundId from payload
        // If your payload includes a real round id field, use that.
        // If not, fall back to hashing or using timer reset + something stable.
        //
        // Best: server includes roundId at a known index. Example assumes parts[1].
        const parts = (args ?? "").split(":");

        // 🔧 Replace this with the actual index from your server payload
        // Example: if parts[1] is roundId:
        const nextRoundId = parts[22] ?? "";

        if (nextRoundId) setRoundId(nextRoundId);

        const info = parseRoundInfo(args);
        setGameInfo((prev) => ({ ...prev, ...info }));

        if (typeof info.timerSec === "number") setServerTimerSec(info.timerSec);
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
      return () => bridge.remove_OnServerEvent?.(onServerEvent);
    }

    console.log(
      "[OneJS] Warning: add_OnServerEvent missing; server events not bound."
    );
    return;
  }, []);

  useEffect(() => {
    const bridge = CS?.Arken?.Bridge?.Instance;
    if (!bridge) {
      console.log("[OneJS] Bridge.Instance not found; events not bound.");
      return;
    }

    const onWebEvent = (eventName: string, args: string) => {
      if (eventName === "onInitializing") {
        setWebState("initializing");
        return;
      }
      if (eventName === "onInitialized") {
        setWebState("initialized");
        return;
      }
      if (eventName === "onAuthorized") {
        const params = JSON.parse(args);
        setWebState("authorized");
        setProfile(params);
      }
    };

    if (typeof bridge.add_OnWebEvent === "function") {
      bridge.add_OnWebEvent(onWebEvent);
      return () => bridge.remove_OnWebEvent?.(onWebEvent);
    }

    console.log(
      "[OneJS] Warning: add_OnWebEvent missing; server events not bound."
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

  function onSelectAction(k: string) {
    if (k === "Inventory") {
      CS.Arken.Bridge.Instance.ShowWeb();
      // CS.Arken.Web.WebCommunicator.Instance._prefab.gameObject.SetActive(true);
    }
    if (k === "Market") {
      setModal("Settings" as ModalKey);
    } else {
      setModal(k as ModalKey);
    }
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
      {serverState.current === "joined" ? (
        <Fragment>
          <Scaled $scale={scale}>
            <ActionBarPos>
              <ActionBarSwiper
                onUse={emitAction}
                globalCooldownSec={1}
                bars={bars}
              />
            </ActionBarPos>
          </Scaled>

          <Scaled $scale={scale}>
            <GridPos>
              <ActionGrid actions={actions} onUse={emitEmote} />
            </GridPos>
          </Scaled>

          <Scaled $scale={scale}>
            <Hud spec={hudSpec} />
          </Scaled>

          <Scaled $scale={scale}>
            <ActionHub spec={menuSpec} onSelect={onSelectAction} />
          </Scaled>
          <Scaled $scale={scale}>
            <SideDock
              spec={sideDockSpec}
              renderContent={renderSideDockContent}
            />
          </Scaled>
          <Scaled $scale={scale}>
            {/* ✅ Reward popup (top-center)
              IMPORTANT: render this LAST inside Scaled so it draws on top (no z-index in USS). */}
            {reward ? (
              <RewardAnchor>
                {/* scale with UI zoom (old web used "zoom") */}
                <div style={{ scale: `${scale} ${scale}` }}>
                  <RewardCardOuter>
                    <RewardCard>
                      <Icon
                        src={`/images/rewards/${reward.rewardItemName}.png`}
                        width={40}
                        height={40}
                      />
                      {/* <Text size={18} bold color="#fff">
                      {reward.quantity} {reward.rewardItemName.toUpperCase()}
                    </Text> */}
                    </RewardCard>
                  </RewardCardOuter>
                </div>
              </RewardAnchor>
            ) : null}
          </Scaled>
        </Fragment>
      ) : null}

      {serverState.current === "spectating" && isUpgradeOpen ? (
        <Scaled $scale={scale}>
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
        </Scaled>
      ) : null}

      {serverState.current === "none" || serverState.current === "loading" ? (
        <Scaled $scale={scale}>
          <StatusOverlay picking-mode={PickingMode.Position}>
            <BottomCenter picking-mode={PickingMode.Position}>
              <StatusCard picking-mode={PickingMode.Position}>
                <Text size={22} bold color="#b59766">
                  Connecting
                </Text>
              </StatusCard>
            </BottomCenter>
          </StatusOverlay>
        </Scaled>
      ) : null}

      <BottomLeft picking-mode={PickingMode.Position}>
        <ButtonFrame picking-mode={PickingMode.Position}>
          {serverState.current === "none" ? (
            <Text size={22} bold color="#b59766">
              Connecting to Arken Web
            </Text>
          ) : serverState.current === "loading" ? (
            <Text size={22} bold color="#b59766">
              Connecting to Arken Web
            </Text>
          ) : webState.current === "none" ||
            webState.current === "initializing" ? (
            <Text size={22} bold color="#b59766">
              Connecting to Arken Web
            </Text>
          ) : !profile?.name ? (
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={showLogin}
            >
              Login
            </Button>
          ) : profile?.name && serverState.current === "spectating" ? (
            <Fragment>
              <Text size={22} bold color="#b59766" style={{ padding: 10 }}>
                {profile.name}
              </Text>
              <Button
                picking-mode={PickingMode.Position}
                onPointerDown={(e) => (e as any)?.StopPropagation?.()}
                onClick={emitLoad}
              >
                Revive
              </Button>
            </Fragment>
          ) : (
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={emitLoad}
            >
              Sign Out
            </Button>
          )}
        </ButtonFrame>
      </BottomLeft>

      <BottomRight picking-mode={PickingMode.Position}>
        <ButtonFrame picking-mode={PickingMode.Position}>
          <Button
            picking-mode={PickingMode.Position}
            onPointerDown={(e) => (e as any)?.StopPropagation?.()}
            onClick={showSkills}
          >
            P
          </Button>
        </ButtonFrame>
        <ButtonFrame picking-mode={PickingMode.Position}>
          <Button
            picking-mode={PickingMode.Position}
            onPointerDown={(e) => (e as any)?.StopPropagation?.()}
            onClick={showInbox}
          >
            M
          </Button>
        </ButtonFrame>
      </BottomRight>

      {serverState.current === "disconnected" ? (
        <BottomCenter picking-mode={PickingMode.Position}>
          <ButtonFrame picking-mode={PickingMode.Position}>
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={emitJoin}
            >
              Reconnect
            </Button>
          </ButtonFrame>
        </BottomCenter>
      ) : null}

      <BottomDock>
        <Bottom>
          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/images/events.png`}
                width={70}
                height={70}
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff">
                Explore
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/images/events.png`}
                width={70}
                height={70}
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff">
                Heroes
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Dot />
              <Icon
                src={`/evolution/images/events.png`}
                width={70}
                height={70}
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff">
                Inventory
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/images/events.png`}
                width={70}
                height={70}
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff">
                Shop
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/images/events.png`}
                width={70}
                height={70}
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff">
                Guild
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/images/events.png`}
                width={70}
                height={70}
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff">
                Den
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>
        </Bottom>
      </BottomDock>

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
              {modal === "Settings" ? (
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
