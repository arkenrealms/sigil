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
  label?: string; // optional for later
};

export type SideDockSpec = {
  tabs: SideDockTab[];
  initialTabKey: SideDockTabKey;

  // Mobile behavior
  mobileHandleIcon: string; // e.g. "/evolution/images/arrow_left.png"
  mobileCollapsedWidthPx?: number; // handle size
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
`;

const RailIconWrap = styled.div`
  width: 58px;
  height: 58px;
`;

const RailSpacer = styled.div`
  height: 18px;
`;

/* --- MOBILE: handle + drawer --- */
const MobilePos = styled.div`
  position: absolute;
  top: 120px;
  right: 10px;

  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

/* The arrow handle */
const MobileHandle = styled.div`
  width: 46px;
  height: 46px;

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
`;

/* Drawer shell */
const MobilePanel = styled.div<{ $open?: boolean; $w?: number }>`
  margin-right: 10px;
  width: ${(p) => (p.$open ? `${p.$w ?? 420}px` : "0px")};
  height: ${(p) => (p.$open ? "auto" : "0px")};
  overflow: hidden;

  background-color: rgba(0, 0, 0, 0.55);
  border-width: ${(p) => (p.$open ? "1px" : "0px")};
  border-color: rgba(255, 255, 255, 0.14);
  border-radius: 12px;

  padding: ${(p) => (p.$open ? "0px" : "0px")};
`;

/* Inside drawer we render (Content + Rail) in a row */
const MobileInner = styled.div`
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
    // On mobile, selecting tab should open (so user sees content)
    setMobileOpen(true);
  }

  function renderRail(isMobile: boolean) {
    // No fragments
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

  return (
    <div>
      {/* DESKTOP: always visible */}
      <DesktopOnly>
        <Pos>
          <Content>{renderContent(active)}</Content>
          <Rail>{renderRail(false)}</Rail>
        </Pos>
      </DesktopOnly>

      {/* MOBILE: handle + drawer */}
      <MobileOnly>
        <MobilePos>
          <MobilePanel $open={mobileOpen} $w={spec.mobilePanelWidthPx ?? 420}>
            <MobileInner>
              <MobileContent>{renderContent(active)}</MobileContent>
              <MobileRail>{renderRail(true)}</MobileRail>
            </MobileInner>
          </MobilePanel>

          <MobileHandle onPointerDown={() => setMobileOpen((v) => !v)}>
            <HandleIconWrap>
              <Icon src={spec.mobileHandleIcon} shadow width={60} height={60} />
            </HandleIconWrap>
          </MobileHandle>
        </MobilePos>
      </MobileOnly>
    </div>
  );
}
