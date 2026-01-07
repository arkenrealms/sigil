// sigil/ui/game/components/SideDock.tsx
import { h } from "preact";
import { useMemo, useState } from "preact/hooks";
import styled from "../../../util/styled";
import { Icon } from "../../core/components/Icon";
import { DesktopOnly, MobileOnly } from "../../core/components/ResponsiveSlots";

export type SideDockTabKey = string;

export type SideDockTab = {
  key: SideDockTabKey;
  icon: string;
  label?: string;
};

export type SideDockSpec = {
  tabs: SideDockTab[];
  initialTabKey: SideDockTabKey;

  // Mobile behavior
  mobileHandleIcon: string; // e.g. "/evolution/images/arrow_left.png"
  mobileCollapsedWidthPx?: number; // handle size (optional)
  mobilePanelWidthPx?: number; // drawer width
};

const Pos = styled.div`
  position: absolute;
  top: 200px;
  right: 10px;

  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

/* Content panel (desktop) */
const Content = styled.div`
  width: 320px;
  padding: 14px 14px;
  margin-right: 14px;

  border-width: 0px;
  border-color: rgba(255, 255, 255, 0.14);
  border-radius: 12px;
`;

/* Rail */
const Rail = styled.div`
  padding: 10px 12px;
  border-width: 0px;
  border-color: rgba(255, 255, 255, 0.14);
  border-radius: 12px;

  display: flex;
  flex-direction: column;
`;

const RailBtn = styled.div<{ $active?: boolean }>`
  opacity: ${(p) => (p.$active ? "1" : "0.8")};

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const RailIconWrap = styled.div`
  width: 58px;
  height: 58px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const RailSpacer = styled.div`
  height: 18px;
`;

/* ───────────────────────────── */
/* MOBILE: handle pinned, panel slides */
/* ───────────────────────────── */

const MobilePos = styled.div`
  position: absolute;
  top: 120px;
  right: 10px;

  pointer-events: auto;
`;

/* The arrow handle (pinned to viewport edge) */
const MobileHandle = styled.div<{ $size?: number }>`
  position: absolute;
  left: 0px;
  top: 0px;

  width: ${(p) => `${p.$size ?? 46}px`};
  height: ${(p) => `${p.$size ?? 46}px`};

  background-color: rgba(0, 0, 0, 0.55);
  border-width: 2px;
  border-color: rgb(214, 200, 78);
  border-radius: 10px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const HandleIconWrap = styled.div`
  width: 26px;
  height: 26px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

/* Sliding panel (absolutely positioned so it does NOT push the handle) */
const MobilePanel = styled.div<{ $w?: number; $right?: number }>`
  width: ${(p) => `${p.$w ?? 300}px`};

  background-color: rgba(0, 0, 0, 0.55);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.14);
  border-radius: 12px;

  will-change: translate;
`;

const MobileInner = styled.div<{ $w?: number }>`
  position: absolute;
  top: 0px;
  left: 60px;
  width: ${(p) => `${p.$w ?? 300}px`};

  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

/* Mobile versions (tighter) */
const MobileContent = styled.div`
  width: 320px;
  padding: 14px 14px;
  margin-right: 14px;

  background-color: rgba(0, 0, 0, 0.55);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.14);
  border-radius: 12px;
`;

const MobileRail = styled.div`
  padding: 10px 12px;
  background-color: rgba(0, 0, 0, 0.35);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.14);
  border-radius: 12px;

  display: flex;
  flex-direction: column;
`;

export function SideDock(props: {
  spec: SideDockSpec;
  renderContent: (activeKey: SideDockTabKey) => any;
  onTabChange?: (key: SideDockTabKey) => void;
}) {
  const { spec, renderContent, onTabChange } = props;

  const [active, setActive] = useState<SideDockTabKey>(spec.initialTabKey);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = useMemo(() => spec.tabs, [spec.tabs]);

  function setTab(k: SideDockTabKey) {
    setActive(k);
    onTabChange?.(k);
  }

  function handleSelectTab(k: SideDockTabKey) {
    setTab(k);
    setMobileOpen(true);
  }

  function renderRail() {
    return (
      <div>
        {tabs.map((t, idx) => (
          <div>
            <RailBtn
              $active={active === t.key}
              onPointerDown={() => handleSelectTab(t.key)}
            >
              <RailIconWrap>
                <Icon src={t.icon} shadow width={60} height={60} />
              </RailIconWrap>
            </RailBtn>
            {idx !== tabs.length - 1 ? <RailSpacer /> : null}
          </div>
        ))}
      </div>
    );
  }

  const panelW = spec.mobilePanelWidthPx ?? 300;
  const handleSize = spec.mobileCollapsedWidthPx ?? 46;
  const gap = -30;

  // Panel sits "to the left of" the handle by (handleSize + gap)
  const panelRight = handleSize + gap;

  // When closed: push panel to the right by its full width + gap so it's fully offscreen
  const closedDx = panelW + gap;

  const durationMs = 220;

  return (
    <div>
      {/* DESKTOP: always visible */}
      <DesktopOnly>
        <Pos>
          <Content>{renderContent(active)}</Content>
          <Rail>{renderRail()}</Rail>
        </Pos>
      </DesktopOnly>

      {/* MOBILE: panel slides, handle stays pinned */}
      <MobileOnly>
        <MobilePos>
          <MobilePanel
            $w={panelW}
            $right={panelRight}
            style={
              {
                translate: `${mobileOpen ? 0 : closedDx}px 0px`,
                transitionProperty: "translate",
                transitionDuration: `${durationMs}ms`,
                transitionTimingFunction: "ease-out",
              } as any
            }
          >
            <MobileHandle
              $size={handleSize}
              onPointerDown={() => setMobileOpen((v) => !v)}
            >
              <HandleIconWrap
                style={
                  {
                    rotate: mobileOpen ? "180deg" : "0deg",
                    transitionProperty: "rotate",
                    transitionDuration: `${durationMs}ms`,
                    transitionTimingFunction: "ease-out",
                  } as any
                }
              >
                <Icon
                  src={spec.mobileHandleIcon}
                  shadow
                  width={26}
                  height={26}
                />
              </HandleIconWrap>
            </MobileHandle>
            <MobileInner $w={panelW - 60}>
              <MobileContent>{renderContent(active)}</MobileContent>
              <MobileRail>{renderRail()}</MobileRail>
            </MobileInner>
          </MobilePanel>
        </MobilePos>
      </MobileOnly>
    </div>
  );
}
