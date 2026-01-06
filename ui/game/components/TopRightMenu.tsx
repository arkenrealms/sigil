// sigil/ui/game/components/TopRightMenu.tsx
import { h } from "preact";
import { useState } from "preact/hooks";
import styled from "../../../util/styled";
import { Icon } from "../../core/components/Icon";
import { DesktopOnly, MobileOnly } from "../../core/components/ResponsiveSlots";

export type TopRightMenuItem = {
  key: string;
  label: string;
  icon: string;
};

export type TopRightMenuSpec = {
  items: TopRightMenuItem[];
  mobileHandleIcon: string; // e.g. "/evolution/images/arrow_left.png"
};

const TopRightPos = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
`;

/* Menu panel */
const MenuBox = styled.div`
  width: 520px;
  padding: 10px 12px 12px 12px;

  background-color: rgba(0, 0, 0, 0.75);
  border-width: 2px;
  border-color: rgb(214, 200, 78);
  border-radius: 0px 0px 12px 12px;
`;

const MenuRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const MenuItem = styled.div`
  width: 20%;
  -unity-text-align: middle-center;
  opacity: 0.92;
`;

const MenuIconWrap = styled.div`
  width: 56px;
  height: 56px;
  margin-left: auto;
  margin-right: auto;
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

  background-color: rgba(0, 0, 0, 0.55);
  border-width: 2px;
  border-color: rgb(214, 200, 78);
  border-radius: 10px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const ArrowWrap = styled.div`
  width: 26px;
  height: 26px;
`;

const MobileMenuPanel = styled.div<{ $open?: boolean }>`
  margin-right: 10px;
  width: ${(p) => (p.$open ? "520px" : "0px")};
  height: ${(p) => (p.$open ? "auto" : "0px")};
  overflow: hidden;

  background-color: rgba(0, 0, 0, 0.75);
  border-width: ${(p) => (p.$open ? "2px" : "0px")};
  border-color: rgb(214, 200, 78);
  border-radius: 0px 0px 12px 12px;

  padding: ${(p) => (p.$open ? "10px 12px 12px 12px" : "0px")};
`;

export function TopRightMenu(props: {
  spec: TopRightMenuSpec;
  onSelect: (key: string) => void;
}) {
  const { spec, onSelect } = props;

  const [mobileOpen, setMobileOpen] = useState(false);

  function select(key: string) {
    onSelect(key);
    setMobileOpen(false);
  }

  function renderMenuGrid() {
    return (
      <MenuRow>
        {spec.items.map((it) => (
          <MenuItem onPointerDown={() => select(it.key)}>
            <MenuIconWrap>
              <Icon src={it.icon} />
            </MenuIconWrap>
            <MenuLabel>{it.label}</MenuLabel>
          </MenuItem>
        ))}
      </MenuRow>
    );
  }

  return (
    <TopRightPos>
      <DesktopOnly>
        <MenuBox>{renderMenuGrid()}</MenuBox>
      </DesktopOnly>

      <MobileOnly>
        <MobileMenuPos>
          <MobileMenuPanel $open={mobileOpen}>
            <MenuBox>{renderMenuGrid()}</MenuBox>
          </MobileMenuPanel>

          <MobileMenuHandle onPointerDown={() => setMobileOpen((v) => !v)}>
            <ArrowWrap>
              <Icon src={spec.mobileHandleIcon} />
            </ArrowWrap>
          </MobileMenuHandle>
        </MobileMenuPos>
      </MobileOnly>
    </TopRightPos>
  );
}
