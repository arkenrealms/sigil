// arken/sigil/ui/game/views/InGame.tsx
import { h, Fragment } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import styled from "../../../../util/styled";
import { ActionBarSwiper } from "../../../../ui/actions/components/ActionBarSwiper";
import { ActionGrid } from "../../../../ui/actions/components/ActionGrid";
import actions from "../../../../data/actions";
import bars from "../../../../data/bars";
import { Hud, HudSpec } from "../../../../ui/game/components/Hud";
import { Icon } from "../../../../ui/core/components/Icon";
import { useLeaderboard } from "../../../../ui/game/state/useLeaderboard";
import UpgradeGrid from "../../../../ui/game/components/UpgradeGrid";
import { PartyDockContent } from "./InGame/PartyDockContent";
import { QuestDockContent } from "./InGame/QuestDockContent";
import { GameDockContent } from "./InGame/GameDockContent";
import { PickingMode } from "UnityEngine/UIElements";
import {
  ActionHub,
  ActionHubItem,
  ActionHubSpec,
} from "../../../../ui/game/components/ActionHub";
import {
  SideDock,
  SideDockSpec,
  SideDockTabKey,
} from "../../../../ui/game/components/SideDock";
import { SettingsPanel } from "../../../../ui/game/components/SettingsPanel";
import { useUiZoomPercent } from "../../../../ui/game/state/useUiZoom";
import { Text } from "../../../../ui/core/components/Text";
import { getApp } from "../../../../appInstance";
import { useAppData, setAppData } from "../../../../ui/game/state/useAppData";
import { useAppSettings } from "../../../../hooks/useAppSettings";

const app = getApp();

const showInbox = () => app.trpc.forge.core.navigate.mutate("/inbox");
const showSkills = () => app.trpc.forge.core.navigate.mutate("/skills");
const showTrek = () => app.trpc.forge.core.navigate.mutate("/trek");

type PersistedInGame = {
  roundId: string;
  serverState: ServerState;
  webState: WebState;
  gameInfo: GameInfo;
  serverTimerSec: number | null;
  reward: Reward | null;
};

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

const HudWrap = styled.div<{ background: boolean }>`
  position: absolute;
  top: -6px;
  left: 20px;
  scale: 1.3;
  transform-origin: 0px 0px;
  padding-top: 5px;

  ${(p) =>
    p.background
      ? `background-color: #11111d;
  border-width: 2px;
  border-color: #b59766;
  border-radius: 6px;`
      : ""}
`;

const StatusCard = styled.div`
  padding: 10px 14px;

  display: flex;
  justify-content: center;
  align-items: center;
`;
// background-color: #11111d;
// border-width: 2px;
// border-color: #b59766;
// border-radius: 12px;

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

const BottomDock = styled.div<{
  $scale: number;
}>`
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: -10px;
  max-width: 500px;
  height: 120px;

  display: flex;
  justify-content: center;

  /* keeps it above anything behind it */
  pointer-events: auto;
`;

const Bottom = styled.div<{ background: boolean; $scale: number }>`
  width: 100%;
  padding-bottom: 10px;

  display: flex;
  flex-direction: row;
  align-items: stretch;

  /* UI Toolkit: scale is a property */
  scale: ${(p) => p.$scale} ${(p) => p.$scale};
  transform-origin: 0px 0px;

  /* keep content filling the visible area after scaling */
  width: ${(p) => `${(1 / p.$scale) * 100}%`};
  height: ${(p) => `${(1 / p.$scale) * 100}%`};

  ${(p) =>
    p.background
      ? `border-width: 2px;
  border-color: #b59766;
  border-radius: 15px;
  background-color: #11111d;`
      : ""}

  overflow: hidden; /* makes rounded corners clip children nicely */
`;

const BottomCenter = styled.div`
  position: absolute;
  left: 50%;
  bottom: 150px;
  translate: -50% 0;
`;

const ButtonFrame = styled.div<{ background: boolean }>`
  ${(p) =>
    p.background
      ? `background-color: #11111d;
  border-width: 2px;
  border-color: #b59766;
  border-radius: 12px;`
      : ""}
  padding: 7px;
  margin-bottom: 5px;
`;

const Button = styled.div`
  padding: 7px 8px;

  border-radius: 10px;

  display: flex;
  justify-content: center;
  align-items: center;

  color: rgba(255, 255, 255, 0.92);
  -unity-font-style: bold;

  &:hover {
    filter: grayscale(1) sepia(0.5);
  }
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
  top: -6px;
  left: 50%;
  translate: -50% 0;

  /* keep it compact + clickable later */
`;

const RewardCardOuter = styled.div``;

const RewardCard = styled.div<{ background: boolean }>`
  border-radius: 6px;
  padding: 19px 14px 10px 14px;

  ${(p) =>
    p.background
      ? `background-color: #11111d;
  border-width: 2px;
  border-color: #b59766;
  border-radius: 6px;`
      : ""}

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
  | "authorizing"
  | "joining"
  | "joined"
  | "spectating"
  | "disconnected";

type WebState =
  | "none"
  | "initializing"
  | "initialized"
  | "authorizing"
  | "authorized";

const BottomMenuIconWrap = styled.div`
  width: 70px;
  height: 70px;
  padding: 10px;
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

  &:hover {
    filter: grayscale(1) sepia(1.5);
  }
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

  if (!Number.isFinite(timerSec)) {
    // todo: show error
  }

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

export default function ({ app }) {
  const [modal, setModal] = useState<ModalKey>(null);
  const settings = useAppSettings(app);

  // constrain zoom to 50%..150% no matter what storage returns
  const zoomRaw = useUiZoomPercent();
  const zoom = clamp(zoomRaw, 80, 120);
  const scale = zoom / 100;

  const lb = useLeaderboard();

  const action = app.trpc.evolution.shard.action.useMutation(); //action.mutateAsync(actionId);
  const load = app.trpc.evolution.shard.load.useMutation(); //load.mutateAsync();
  const join = app.trpc.evolution.shard.join.useMutation(); //join.mutateAsync();
  const showLogin = app.trpc.forge.core.showLogin.useMutation();

  if (!app.settings?.gameInfo)
    app.settings = {
      gameInfo: {},
    };

  const [displayTimerSec, setDisplayTimerSec] = useState<number | null>(null);

  useEffect(() => {
    setDisplayTimerSec(app.settings.serverTimerSec);
  }, [app.settings.serverTimerSec]);

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
      rewardText: `${app.settings.gameInfo.rewardItemAmount || "—"} ${
        app.settings.gameInfo.rewardItemName || ""
      }`.trim(),
      rows: lb,
    }),
    [
      lb,
      displayTimerSec,
      app.settings.gameInfo.rewardItemAmount,
      app.settings.gameInfo.rewardItemName,
    ],
  );

  const menuItems: ActionHubItem[] = useMemo(
    () => [
      { key: "Events", label: "Events", icon: "/evolution/icons/research.png" },
      { key: "Chest", label: "Chest", icon: "/evolution/icons/chest.png" },
      {
        key: "Inventory",
        label: "Inventory",
        icon: "/evolution/icons/bag2.png",
      },
      { key: "Market", label: "Market", icon: "/evolution/icons/politics.png" },
      {
        key: "Settings",
        label: "Settings",
        icon: "/evolution/icons/settings.png",
      },
      { key: "Craft", label: "Craft", icon: "/evolution/icons/helmet.png" },
      { key: "Guild", label: "Guild", icon: "/evolution/icons/castle.png" },
      {
        key: "Party",
        label: "Party",
        icon: "/evolution/icons/group-users.png",
      },
      { key: "PVP", label: "PVP", icon: "/evolution/icons/swords2.png" },
      {
        key: "Leaderboard",
        label: "Leaderboard",
        icon: "/evolution/icons/leaderboard.png",
      },
    ],
    [],
  );

  const menuSpec: ActionHubSpec = useMemo(
    () => ({
      items: menuItems,
      mobileHandleIcon: "/evolution/icons/settings.png",
    }),
    [menuItems],
  );

  function onSelectAction(k: string) {
    if (k === "Inventory") {
      CS.Arken?.Bridge?.Instance?.ShowWeb();
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
        { key: "quest", icon: "/evolution/icons/quest.png" },
        { key: "party", icon: "/evolution/icons/people.png" },
        { key: "game", icon: "/evolution/icons/map.png" },
      ],
      initialTabKey: "game",
      mobileHandleIcon: "/evolution/icons/arrow-left.png",
      mobilePanelWidthPx: 390,
    }),
    [],
  );

  function renderSideDockContent(active: SideDockTabKey) {
    if (active === "party") return <PartyDockContent />;
    if (active === "quest") return <QuestDockContent />;
    return <GameDockContent gameMode={app.settings?.gameInfo?.gameMode} />;
  }
  return (
    <Wrapper>
      {app.settings.serverState === "joined" ? (
        <Scaled $scale={scale}>
          {app.settings.profile?.name ? (
            <ActionBarPos>
              <ActionBarSwiper
                onUse={(actionId: string) => action.mutateAsync(actionId)}
                globalCooldownSec={1}
                bars={bars}
              />
            </ActionBarPos>
          ) : null}

          {/* <Scaled $scale={scale}>
            <GridPos>
              <ActionGrid actions={actions} onUse={emitEmote} />
            </GridPos>
          </Scaled> */}

          <HudWrap background={false}>
            <Hud spec={hudSpec} />
          </HudWrap>

          <ActionHub spec={menuSpec} onSelect={onSelectAction} />
          <SideDock spec={sideDockSpec} renderContent={renderSideDockContent} />
          {/* ✅ Reward popup (top-center)
              IMPORTANT: render this LAST inside Scaled so it draws on top (no z-index in USS). */}
          {app.settings.reward ? (
            <RewardAnchor>
              {/* scale with UI zoom (old web used "zoom") */}
              <div style={{ scale: `${scale} ${scale}` }}>
                <RewardCardOuter>
                  <RewardCard background={false}>
                    <Icon
                      src={`/images/rewards/${app.settings.reward.rewardItemName}.png`}
                      width={40}
                      height={40}
                      shadow
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
      ) : null}

      {app.settings.serverState === "spectating" &&
      app.settings.isUpgradeOpen ? (
        <Scaled $scale={scale}>
          <UpgradeOverlay picking-mode={PickingMode.Position}>
            <UpgradeOverlayInner picking-mode={PickingMode.Position}>
              <UpgradeGrid
                upgrades={app.settings.upgrades}
                onUse={(upgradeId) => {
                  setAppData({ isUpgradeOpen: false }); // TODO: replace
                  CS.Arken?.Bridge?.Instance?.Emit(
                    "chooseUpgrade",
                    JSON.stringify(upgradeId),
                  );
                }}
              />
            </UpgradeOverlayInner>
          </UpgradeOverlay>
        </Scaled>
      ) : null}

      {/* <Scaled $scale={scale}> */}
      <BottomCenter picking-mode={PickingMode.Position}>
        {app.settings.serverState === "none" ? (
          <StatusCard picking-mode={PickingMode.Position}>
            <Text size={20} bold shadow color="#fff">
              Connecting to realm...
            </Text>
          </StatusCard>
        ) : app.settings.serverState === "authorizing" ? (
          <StatusCard picking-mode={PickingMode.Position}>
            <Text size={20} bold shadow color="#fff">
              Authorizing with realm...
            </Text>
          </StatusCard>
        ) : app.settings.serverState === "spectating" &&
          app.settings.profile?.name ? (
          <StatusCard picking-mode={PickingMode.Position}>
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={() => load.mutateAsync()}
            >
              <Text size={24} bold shadow color="#b59766">
                Revive
              </Text>
            </Button>
          </StatusCard>
        ) : app.settings.webState === "none" ||
          app.settings.webState === "initializing" ? (
          <StatusCard picking-mode={PickingMode.Position}>
            <Text size={20} bold shadow color="#fff">
              Connecting to omniverse....
            </Text>
          </StatusCard>
        ) : app.settings.webState === "initialized" &&
          !app.settings.profile?.name ? (
          <ButtonFrame picking-mode={PickingMode.Position} background>
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={() => showLogin.mutateAsync()}
            >
              <Text size={24} bold color="#fff">
                Login
              </Text>
            </Button>
          </ButtonFrame>
        ) : app.settings.webState === "authorizing" ? (
          <StatusCard picking-mode={PickingMode.Position}>
            <Text size={20} bold shadow color="#fff">
              Authorizing with omniverse...
            </Text>
          </StatusCard>
        ) : null}
      </BottomCenter>
      {/* </Scaled> */}

      {/* <BottomLeft picking-mode={PickingMode.Position}>
        {profile?.name ? (
          <ButtonFrame picking-mode={PickingMode.Position} background={false}>
            <Text size={22} bold color="#b59766" style={{ padding: 10 }}>
              {profile.name}
            </Text>
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={load}
            >
              <Text size={18} bold color="#FFF">
                Sign Out
              </Text>
            </Button>
          </ButtonFrame>
        ) : null}
      </BottomLeft> */}

      <BottomRight picking-mode={PickingMode.Position}>
        <div style={{ scale: `${scale} ${scale}` }}>
          <ButtonFrame picking-mode={PickingMode.Position} background={false}>
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={showSkills}
            >
              <Icon
                src={`/evolution/icons/swirl.png`}
                width={40}
                height={40}
                shadow
              />
            </Button>
          </ButtonFrame>
          <ButtonFrame picking-mode={PickingMode.Position} background={false}>
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={showTrek}
            >
              <Icon
                src={`/evolution/icons/trek.png`}
                width={40}
                height={40}
                shadow
              />
            </Button>
          </ButtonFrame>
          <ButtonFrame picking-mode={PickingMode.Position} background={false}>
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={showInbox}
            >
              <Icon
                src={`/evolution/icons/mail.png`}
                width={40}
                height={40}
                shadow
              />
            </Button>
          </ButtonFrame>
        </div>
      </BottomRight>

      {app.settings.serverState === "disconnected" &&
      app.settings.webState === "authorized" ? (
        <BottomCenter picking-mode={PickingMode.Position}>
          <ButtonFrame picking-mode={PickingMode.Position} background={false}>
            <Button
              picking-mode={PickingMode.Position}
              onPointerDown={(e) => (e as any)?.StopPropagation?.()}
              onClick={() => join.mutateAsync()}
            >
              <Text size={24} bold shadow color="#b59766">
                Reconnect
              </Text>
            </Button>
          </ButtonFrame>
        </BottomCenter>
      ) : null}

      {app.settings.webState === "error" ? (
        <BottomCenter picking-mode={PickingMode.Position}>
          <Text size={48} bold shadow color="#fff">
            Error connecting to omniverse
          </Text>
        </BottomCenter>
      ) : null}

      <BottomDock $scale={scale}>
        <Bottom $scale={scale} background={false}>
          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/icons/swords.png`}
                width={50}
                height={50}
                shadow
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff" shadow>
                Explore
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/icons/helmet.png`}
                width={50}
                height={50}
                shadow
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff" shadow>
                Heroes
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Dot />
              <Icon
                src={`/evolution/icons/bag2.png`}
                width={50}
                height={50}
                shadow
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff" shadow>
                Inventory
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/icons/shop.png`}
                width={50}
                height={50}
                shadow
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff" shadow>
                Shop
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/icons/flag2.png`}
                width={50}
                height={50}
                shadow
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff" shadow>
                Guild
              </Text>
            </BottomMenuLabel>
          </BottomMenuItem>

          <BottomMenuItem>
            <BottomMenuIconWrap>
              <Icon
                src={`/evolution/icons/den.png`}
                width={50}
                height={50}
                shadow
              />
            </BottomMenuIconWrap>
            <BottomMenuLabel>
              <Text size={16} bold color="#fff" shadow>
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
