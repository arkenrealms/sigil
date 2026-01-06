// sigil/ui/game/components/GameMenu.tsx
import { h } from "preact";
import { useState } from "preact/hooks";
import styled from "../../../util/styled";
import { Icon } from "../../core/components/Icon";
import { DesktopOnly, MobileOnly } from "../../core/components/ResponsiveSlots";
import type { MenuModel } from "../../core/uiModel/normalize";

const DesktopPos = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
`;

const MobilePos = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;

  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

const Panel = styled.div`
  width: 520px;
  padding: 10px 12px 12px 12px;
  background-color: rgba(0, 0, 0, 0.75);
  border-width: 2px;
  border-color: rgb(214, 200, 78);
  border-radius: 0px 0px 12px 12px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const Item = styled.div`
  width: 20%;
  -unity-text-align: middle-center;
  opacity: 0.92;
`;

const IconWrap = styled.div`
  width: 56px;
  height: 56px;
  margin-left: auto;
  margin-right: auto;
`;

const Label = styled.div`
  margin-top: 6px;
  font-size: 13px;
  -unity-font-style: bold;
  color: rgba(255, 255, 255, 0.95);
`;

const Handle = styled.div`
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

const HandleIcon = styled.div`
  width: 26px;
  height: 26px;
`;

const Drawer = styled.div<{ $open?: boolean }>`
  margin-right: 10px;
  width: ${(p) => (p.$open ? "520px" : "0px")};
  height: ${(p) => (p.$open ? "auto" : "0px")};
  overflow: hidden;

  border-width: ${(p) => (p.$open ? "2px" : "0px")};
  border-color: rgb(214, 200, 78);
  border-radius: 0px 0px 12px 12px;

  background-color: rgba(0, 0, 0, 0.75);
  padding: ${(p) => (p.$open ? "10px 12px 12px 12px" : "0px")};
`;

export function GameMenu(props: {
  model: MenuModel;
  onModal?: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);

  function runAction(a: any) {
    // Close drawer on interaction (mobile UX)
    setOpen(false);

    if (!a) return;

    if (a.type === "modal") {
      props.onModal?.(a.key);
      return;
    }

    if (a.type === "emit") {
      (globalThis as any).Arken?.Bridge?.emit?.(a.event, a.payload);
      return;
    }
  }

  function renderGrid() {
    return (
      <Row>
        {props.model.items.map((it) => (
          <Item onPointerDown={() => runAction(it.action)}>
            <IconWrap>
              <Icon src={it.icon} />
            </IconWrap>
            <Label>{it.label}</Label>
          </Item>
        ))}
      </Row>
    );
  }

  return (
    <div>
      <DesktopPos>
        <DesktopOnly>
          <Panel>{renderGrid()}</Panel>
        </DesktopOnly>
      </DesktopPos>

      <MobileOnly>
        <MobilePos>
          <Drawer $open={open}>{renderGrid()}</Drawer>
          <Handle onPointerDown={() => setOpen((v) => !v)}>
            <HandleIcon>
              <Icon src={props.model.responsive.mobile.handleIcon} />
            </HandleIcon>
          </Handle>
        </MobilePos>
      </MobileOnly>
    </div>
  );
}
