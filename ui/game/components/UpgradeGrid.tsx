import { h } from "preact";
import styled from "../../../util/styled";
import { Text } from "../../core/components/Text";
import { Icon } from "../../core/components/Icon";

export type Upgrade = {
  id: string;
  keybind: string; // "1" | "2" | "3"
  name: string;
  description: string;
  src?: string;
};

type Props = {
  upgrades: Upgrade[];
  onUse: (upgradeId: string) => void;
};

/**
 * Wrapper: row of 3 cards.
 * USS: avoid grid/gap -> use flex + margins
 */
const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: stretch;
`;

const CardWrap = styled.div`
  width: 200px;
  height: 300px;
  margin-left: 12px;
  margin-right: 12px;

  background-color: #11111d;
  border-width: 2px;
  border-color: #b59766;
  border-radius: 15px;
`;

// const Button = styled.div`
//   padding: 7px 8px;

//   border-radius: 10px;
//   background-color: rgba(255, 255, 255, 0.08);

//   display: flex;
//   justify-content: center;
//   align-items: center;

//   padding: 7px 8px;

//   border-radius: 10px;
//   background-color: rgba(255, 255, 255, 0.08);

//   color: rgba(255, 255, 255, 0.92);
//   -unity-font-style: bold;
// `;

/**
 * Card: simple layered border feel using an outer frame + inner panel.
 * USS: no box-shadow, no conic-gradient, no keyframes.
 */
const Card = styled.div`
  position: relative;
  width: 200px;
  height: 300px;

  transition-property: border-color, background-color;
  transition-duration: 120ms;

  color: rgba(255, 255, 255, 0.92);
  -unity-font-style: bold;
`;

const CardHover = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 200px;
  height: 300px;

  border-radius: 10px;

  /* subtle second border layer */

  /* inset-like effect with padding wrapper */
  padding: 6px;
`;

const Inner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  padding: 16px;
`;

const KeyBadge = styled.div`
  position: absolute;
  left: 10px;
  top: 8px;

  font-size: 18px;
  -unity-font-style: bold;
  color: rgb(214, 200, 78);
`;

const IconWrap = styled.div`
  position: absolute;
  top: -26px;
  left: 50%;
  translate: -50% 0;

  width: 56px;
  height: 56px;

  background-color: #11111d;
  border-width: 2px;
  border-color: #b59766;
  border-radius: 6px;
`;

const Title = styled.div`
  margin-top: 18px;
  margin-bottom: 10px;

  text-align: center;

  color: rgb(214, 200, 78);
  -unity-font-style: bold;
`;

const Desc = styled.div`
  text-align: center;

  font-size: 13px;
  line-height: 16px;

  color: rgba(255, 255, 255, 0.92);
`;

/**
 * Click surface: keeps pointer handling explicit.
 * Uses StopPropagation() (capital S) for OneJS/UITK events.
 */
const ClickSurface = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 200px;
  height: 300px;

  border-radius: 10px;
`;

function normalize(upgrades: Upgrade[]) {
  return (upgrades ?? []).slice(0, 3);
}

export default function UpgradeGrid({ upgrades, onUse }: Props) {
  const list = normalize(upgrades);

  return (
    <Row>
      {list.map((u) => (
        <CardWrap key={u.id}>
          <Card>
            <CardHover>
              <Inner>
                <KeyBadge>{u.keybind}</KeyBadge>

                {u.src ? (
                  <IconWrap>
                    <Icon src={u.src} width={52} height={52} />
                  </IconWrap>
                ) : null}

                <Title>
                  <Text size={18} bold color="rgb(214, 200, 78)">
                    {u.name}
                  </Text>
                </Title>

                <Desc>
                  <Text size={14} color="rgba(255,255,255,0.92)">
                    {u.description}
                  </Text>
                </Desc>
              </Inner>
            </CardHover>

            <ClickSurface
              onPointerDown={(e) => {
                (e as any)?.StopPropagation?.();
              }}
              onClick={() => onUse(u.id)}
            />
          </Card>
        </CardWrap>
      ))}
    </Row>
  );
}
