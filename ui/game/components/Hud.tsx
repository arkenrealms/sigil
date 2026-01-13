// sigil/ui/game/components/Hud.tsx
import { h } from "preact";
import { useMemo, useState } from "preact/hooks";
import styled from "../../../util/styled";

/* --- shared --- */
const Lines = styled.div`
  white-space: pre-line;
`;

const Line = styled.div<{ $last?: boolean }>`
  margin-bottom: ${(p) => (p.$last ? "0px" : "4px")};
`;

/* --- HUD shell --- */
const HudPos = styled.div``;

const HudPanel = styled.div`
  border-width: 0px;
  border-color: rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px;
`;

const HudTopRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const HudTopLeft = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
`;

const TimeText = styled.div`
  font-size: 18px;
  -unity-font-style: bold;
  color: rgba(255, 255, 255, 0.95);
`;

const TimeLabel = styled.div`
  margin-left: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
`;

const HudTopRight = styled.div`
  margin-left: 16px;
  display: flex;
  flex-direction: row;
  align-items: baseline;
`;

const RewardText = styled.div`
  font-size: 14px;
  -unity-font-style: bold;
  color: rgb(214, 200, 78);
`;

const RewardLabel = styled.div`
  margin-left: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
`;

const Divider = styled.div`
  margin-top: 8px;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.12);
`;

/* clickable leaderboard panel */
const BoardClick = styled.div`
  margin-top: 8px;
  padding: 6px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.25);
`;

/* table layout */
const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const HeaderCell = styled.div`
  font-size: 11px;
  -unity-font-style: bold;
  color: rgba(255, 255, 255, 0.7);
`;

const CellPlayer = styled.div`
  width: 140px;
`;
const CellRank = styled.div`
  width: 60px;
`;
const CellSmall = styled.div`
  width: 58px;
`;
const CellPoints = styled.div`
  width: 78px;
`;
const CellPing = styled.div`
  width: 68px;
`;

const BodyCell = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
`;

/* Avoid extending styled element issues */
const BodyCellGold = styled.div`
  font-size: 12px;
  color: rgb(214, 200, 78);
  -unity-font-style: bold;
`;

const RowSpacer = styled.div`
  height: 6px;
`;

const Hint = styled.div`
  margin-top: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
`;

export type HudLeaderboardRow = {
  player: string;
  rank: string;
  kills: number;
  deaths: number;
  evolves: number;
  items: number;
  sprites: number;
  points: number;
  ping: string;
};

export type HudSpec = {
  timeLeftText: string;
  rewardText: string;
  rows: HudLeaderboardRow[];
};

export function Hud(props: { spec: HudSpec }) {
  const { spec } = props;

  const [expanded, setExpanded] = useState(false);

  // keep reference stable
  const rows = useMemo(() => spec.rows, [spec.rows]);

  return (
    <HudPos>
      <HudPanel>
        <HudTopRow>
          <HudTopLeft>
            <TimeText>{spec.timeLeftText}</TimeText>
            <TimeLabel>ROUND TIME LEFT</TimeLabel>
          </HudTopLeft>

          {/* <HudTopRight>
            <RewardText>{spec.rewardText}</RewardText>
            <RewardLabel>ROUND REWARD</RewardLabel>
          </HudTopRight> */}
        </HudTopRow>

        <Divider />

        <BoardClick
          onPointerDown={() => setExpanded((v) => !v)}
          onPointerUp={() => {}}
          onPointerCancel={() => {}}
        >
          <Row>
            <CellPlayer>
              <HeaderCell>PLAYER</HeaderCell>
            </CellPlayer>

            <CellRank>
              <HeaderCell>RANK</HeaderCell>
            </CellRank>

            {expanded ? (
              <div style={{ display: "flex", flexDirection: "row" }}>
                <CellSmall>
                  <HeaderCell>KILLS</HeaderCell>
                </CellSmall>
                <CellSmall>
                  <HeaderCell>DEATHS</HeaderCell>
                </CellSmall>
                <CellSmall>
                  <HeaderCell>EVOLVES</HeaderCell>
                </CellSmall>
                <CellSmall>
                  <HeaderCell>ITEMS</HeaderCell>
                </CellSmall>
                <CellSmall>
                  <HeaderCell>SPRITES</HeaderCell>
                </CellSmall>
              </div>
            ) : null}

            <CellPoints>
              <HeaderCell>POINTS</HeaderCell>
            </CellPoints>

            {expanded ? (
              <CellPing>
                <HeaderCell>PING</HeaderCell>
              </CellPing>
            ) : null}
          </Row>

          <RowSpacer />

          {rows.map((r, i) => (
            <div>
              <Row>
                <CellPlayer>
                  <BodyCell>{r.player}</BodyCell>
                </CellPlayer>

                <CellRank>
                  <BodyCellGold>{r.rank}</BodyCellGold>
                </CellRank>

                {expanded ? (
                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <CellSmall>
                      <BodyCell>{r.kills}</BodyCell>
                    </CellSmall>
                    <CellSmall>
                      <BodyCell>{r.deaths}</BodyCell>
                    </CellSmall>
                    <CellSmall>
                      <BodyCell>{r.evolves}</BodyCell>
                    </CellSmall>
                    <CellSmall>
                      <BodyCell>{r.items}</BodyCell>
                    </CellSmall>
                    <CellSmall>
                      <BodyCell>{r.sprites}</BodyCell>
                    </CellSmall>
                  </div>
                ) : null}

                <CellPoints>
                  <BodyCellGold>{r.points}</BodyCellGold>
                </CellPoints>

                {expanded ? (
                  <CellPing>
                    <BodyCell>{r.ping}</BodyCell>
                  </CellPing>
                ) : null}
              </Row>

              {i !== rows.length - 1 ? <RowSpacer /> : null}
            </div>
          ))}

          <Hint>{expanded ? "Tap to collapse" : "Tap to expand"}</Hint>
        </BoardClick>
      </HudPanel>
    </HudPos>
  );
}
