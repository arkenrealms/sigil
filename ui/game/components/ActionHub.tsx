// sigil/ui/game/components/ActionHub.tsx
import { h } from "preact";
import { useMemo, useState } from "preact/hooks";
import styled from "../../../util/styled";
import { Icon } from "../../core/components/Icon";
import { DesktopOnly, MobileOnly } from "../../core/components/ResponsiveSlots";

export type ActionHubItem = {
  key: string;
  label: string;
  icon: string;
};

export type ActionHubSpec = {
  items: ActionHubItem[];
  mobileHandleIcon: string; // e.g. "/evolution/images/arrow_left.png"
};

const TopRightPos = styled.div`
  position: absolute;
  top: -2px;
  right: 10px;
`;

/**
 * Desktop collapsed container: intentionally NO background/border,
 * so it looks like the old "first row only" strip.
 */
const CollapsedBar = styled.div`
  width: 520px;
  padding: 20px 20px 20px 20px;
`;

/* Menu panel (expanded / mobile drawer contents) */
const MenuBox = styled.div`
  width: 520px;
  padding: 20px 20px 20px 20px;
`;
// background-color: #1c1c2e;
// border-width: 2px;
// border-color: #666;
// border-radius: 0px 0px 12px 12px;

const MenuRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: -20px;
`;

const MenuItem = styled.div`
  width: 20%;
  -unity-text-align: middle-center;
  opacity: 1;
  margin-bottom: 20px;

  &:hover {
    filter: grayscale(1) sepia(1.5);
  }
`;

const MenuIconWrap = styled.div`
  width: 56px;
  height: 56px;
  margin-left: auto;
  margin-right: auto;

  position: relative;
`;

const IconLayer = styled.div<{
  $dx?: number;
  $dy?: number;
  $scale?: number;
  $opacity?: number;
}>`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;

  opacity: ${(p) => p.$opacity ?? 1};
  translate: ${(p) => `${p.$dx ?? 0}px ${p.$dy ?? 0}px`};

  scale: ${(p) => p.$scale ?? 1} ${(p) => p.$scale ?? 1};
  transform-origin: 50% 50%;
`;

const MenuLabel = styled.div`
  margin-top: 6px;
  font-size: 13px;
  -unity-font-style: bold;
  color: rgba(255, 255, 255, 0.95);
`;

/* --- MOBILE: handle + drawer --- */
const MobileMenuPos = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;

  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

const MobileMenuHandle = styled.div`
  width: 46px;
  height: 46px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

// background-color: rgba(0, 0, 0, 0.55);
// border-width: 2px;
// border-color: rgb(214, 200, 78);
// border-radius: 10px;

const ArrowWrap = styled.div`
  width: 26px;
  height: 26px;
`;

const MobileMenuPanel = styled.div<{ $open?: boolean }>`
  margin-right: 10px;
  width: ${(p) => (p.$open ? "520px" : "0px")};
  height: ${(p) => (p.$open ? "auto" : "0px")};
  overflow: hidden;

  padding: ${(p) => (p.$open ? "10px 12px 12px 12px" : "0px")};

  scale: 0.5 0.5;
  transform-origin: 0px 0px;
`;

// background-color: rgba(0, 0, 0, 0.75);
// border-width: ${(p) => (p.$open ? "2px" : "0px")};
// border-color: rgb(214, 200, 78);
// border-radius: 0px 0px 12px 12px;

export function ActionHub(props: {
  spec: ActionHubSpec;
  onSelect: (key: string) => void;
}) {
  const { spec, onSelect } = props;

  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const settingsKey = "Settings";

  // Desktop: first row only when collapsed, full list when expanded.
  // Desktop: show 4 items + Settings when collapsed; full list when expanded.
  const desktopItems = useMemo(() => {
    if (desktopExpanded) return spec.items;

    // Take first 4 *non-settings* items, then Settings as slot 5.
    const firstFive = spec.items
      //   .filter((x) => x.key !== settingsKey)
      .slice(0, 5);
    return firstFive;
  }, [spec.items, desktopExpanded]);

  function onItemPress(key: string) {
    // Special behavior: Settings toggles expanded/collapsed (desktop)
    if (key === settingsKey) {
      setDesktopExpanded((v) => !v);

      // Mobile: keep your existing behavior where Settings just closes the drawer.
      // (If you want Settings to open your Settings modal on mobile, change this.)
      if (mobileOpen) setMobileOpen(false);

      return;
    }

    // Normal menu item opens modal
    onSelect(key);

    // Collapse after selection
    setDesktopExpanded(false);
    setMobileOpen(false);
  }

  function renderGrid(items: ActionHubItem[], mode: "desktop" | "mobile") {
    return (
      <MenuRow>
        {items.map((it) => {
          const isSettings = it.key === settingsKey;

          // When expanded, turn "Settings" into "Close" (desktop only)
          const label =
            mode === "desktop" && desktopExpanded && isSettings
              ? "Close"
              : it.label;

          return (
            <MenuItem onPointerDown={() => onItemPress(it.key)}>
              <MenuIconWrap>
                <Icon src={it.icon} shadow width={60} height={60} />
              </MenuIconWrap>
              {desktopExpanded ? <MenuLabel>{label}</MenuLabel> : null}
            </MenuItem>
          );
        })}
      </MenuRow>
    );
  }

  return (
    <TopRightPos>
      <DesktopOnly>
        {desktopExpanded ? (
          <MenuBox>{renderGrid(desktopItems, "desktop")}</MenuBox>
        ) : (
          <CollapsedBar>{renderGrid(desktopItems, "desktop")}</CollapsedBar>
        )}
      </DesktopOnly>

      <MobileOnly>
        <MobileMenuPos>
          <MobileMenuPanel $open={mobileOpen}>
            <MenuBox>{renderGrid(spec.items, "mobile")}</MenuBox>
          </MobileMenuPanel>

          <MobileMenuHandle onPointerDown={() => setMobileOpen((v) => !v)}>
            <ArrowWrap>
              <Icon src={spec.mobileHandleIcon} width={30} height={30} />
            </ArrowWrap>
          </MobileMenuHandle>
        </MobileMenuPos>
      </MobileOnly>
    </TopRightPos>
  );
}
