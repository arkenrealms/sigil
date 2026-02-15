// arken/sigil/ui/game/views/InGame.tsx
import { h, Fragment } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import styled from "../../../util/styled";
import { PickingMode } from "UnityEngine/UIElements";
import { SettingsPanel } from "../components/SettingsPanel";
import { useUiZoomPercent } from "../state/useUiZoom";
import { Text } from "../../core/components/Text";
import { useAppSettings } from "../../../hooks/useAppSettings";

const StatusCard = styled.div`
  padding: 10px 14px;

  display: flex;
  justify-content: center;
  align-items: center;
`;
const FullScreen = styled.div`
  position: absolute;
  left: 0%;
  bottom: 0px;
  width: 100%;
  height: 100%;
  padding-top: 30%;
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

type WebState =
  | "none"
  | "initializing"
  | "initialized"
  | "authorizing"
  | "authorized";

export default function ({ app }) {
  const [modal, setModal] = useState<ModalKey>(null);
  const settings = useAppSettings(app);

  // constrain zoom to 50%..150% no matter what storage returns
  const zoomRaw = useUiZoomPercent();
  const zoom = clamp(zoomRaw, 900, 100);
  const scale = zoom / 100;

  const showLogin = app.trpc.forge.core.showLogin.useMutation();

  return (
    <Wrapper picking-mode={PickingMode.Ignore}>
      <Scaled $scale={scale}>
        <BottomCenter picking-mode={PickingMode.Position}>
          {settings.webState === "none" ||
          settings.webState === "initializing" ? (
            <StatusCard picking-mode={PickingMode.Position}>
              <Text size={60} bold shadow color="#fff">
                Connecting to omniverse....
              </Text>
            </StatusCard>
          ) : settings.webState === "initialized" && !settings.profile?.name ? (
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
          ) : settings.webState === "authorizing" ? (
            <StatusCard picking-mode={PickingMode.Position}>
              <Text size={60} bold shadow color="#fff">
                Authorizing with omniverse...
              </Text>
            </StatusCard>
          ) : null}
        </BottomCenter>
      </Scaled>
      {settings.webState === "error" ? (
        <Scaled $scale={scale}>
          <BottomCenter picking-mode={PickingMode.Position}>
            <Text size={60} bold shadow color="#fff">
              Error connecting to omniverse
            </Text>
          </BottomCenter>
        </Scaled>
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
