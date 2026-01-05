// sigil/ui/game/views/InGame.tsx
import { h } from "preact";
import { useMemo, useState } from "preact/hooks";
import styled from "../../../util/styled";
import { ActionBarSwiper } from "../../actions/components/ActionBarSwiper";
import { ActionGrid } from "../../actions/components/ActionGrid";
import { Icon } from "../../core/components/Icon";
import actions from "./InGame/actions";
import bars from "./InGame/bars";

const onUseAction = (actionId: string) =>
  (globalThis as any).Arken.Bridge.emit("action", actionId);
const onUseEmote = (emoteId: string) =>
  (globalThis as any).Arken.Bridge.emit("emote", emoteId);

const Root = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

/* --- shared --- */
const Lines = styled.div`
  white-space: pre-line;
`;

const Line = styled.div<{ $last?: boolean }>`
  margin-bottom: ${(p) => (p.$last ? "0px" : "4px")};
`;

/* --- TOP LEFT HUD --- */
const HudPos = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  pointer-events: auto;
`;

const HudPanel = styled.div`
  background-color: rgba(0, 0, 0, 0.55);
  border-width: 1px;
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
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.25);
`;

/* Header + rows share this "table" layout using flex + fixed widths */
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

/* Use explicit widths; avoid grid/gap */
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

const BodyCellGold = styled(BodyCell)`
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

/* --- TOP RIGHT MENU (NO GRID, NO GAP) --- */
const TopRightPos = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 60;
  pointer-events: auto;
`;

const MenuBox = styled.div<{ $open?: boolean }>`
  width: 520px;
  padding: 10px 12px 12px 12px;

  background-color: ${(p) =>
    p.$open ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.0)"};
  border-width: 2px;
  border-color: ${(p) => (p.$open ? "rgb(214, 200, 78)" : "rgba(0,0,0,0)")};
  border-radius: 0px 0px 12px 12px;
`;

const MenuRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const MenuItem = styled.div<{ $open?: boolean }>`
  width: 20%;
  align-items: center;
  text-align: center;
  opacity: ${(p) => (p.$open ? "0.92" : "0.75")};
  user-select: none;

  &:hover {
    opacity: 1;
  }
`;

const MenuIconWrap = styled.div<{ $open?: boolean }>`
  width: 56px;
  height: 56px;
  margin-left: auto;
  margin-right: auto;

  filter: ${(p) =>
    p.$open ? "none" : "brightness(1.5) grayscale(1) sepia(1.5)"};
`;

const MenuLabel = styled.div<{ $open?: boolean }>`
  margin-top: 6px;
  font-size: 13px;
  -unity-font-style: bold;
  color: rgba(255, 255, 255, 0.95);
  opacity: ${(p) => (p.$open ? "1" : "0")};
  text-shadow: 0px 1px 0px rgba(0, 0, 0, 0.9);
`;

/* --- RIGHT SIDE 3 ICON RAIL + CONTENT (NO GRID, NO GAP) --- */
const SidePos = styled.div`
  position: absolute;
  top: 120px;
  right: 10px;
  z-index: 40;
  pointer-events: auto;

  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

const SideContent = styled.div`
  width: 320px;
  padding: 14px 14px;
  margin-right: 14px;

  background-color: rgba(0, 0, 0, 0.55);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.14);
  border-radius: 12px;
`;

const SideTitle = styled.div`
  font-size: 14px;
  -unity-font-style: bold;
  color: rgb(214, 200, 78);
  margin-bottom: 10px;
`;

const SideRail = styled.div`
  padding: 10px 12px;
  background-color: rgba(0, 0, 0, 0.35);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.14);
  border-radius: 12px;

  display: flex;
  flex-direction: column;
`;

const RailBtn = styled.div<{ $active?: boolean }>`
  opacity: ${(p) => (p.$active ? "1" : "0.6")};
  user-select: none;

  &:hover {
    opacity: 1;
  }
`;

const RailIconWrap = styled.div<{ $active?: boolean }>`
  width: 58px;
  height: 58px;

  filter: ${(p) =>
    p.$active ? "none" : "brightness(1.3) grayscale(1) sepia(1.2)"};
`;

const RailSpacer = styled.div`
  height: 18px;
`;

/* --- SIMPLE MODAL (dummy) --- */
const ModalShade = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 200;
  background-color: rgba(0, 0, 0, 0.65);
  pointer-events: auto;
`;

const ModalCard = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  width: 560px;

  background-color: rgba(0, 0, 0, 0.92);
  border-width: 2px;
  border-color: rgb(214, 200, 78);
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
  color: rgb(214, 200, 78);
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

/* --- BOTTOM UI POSITIONS (KEEP EXACTLY LIKE YOUR WORKING VERSION) --- */
const BarPos = styled.div`
  position: absolute;
  bottom: 80px;
  left: 50%;
  translate: -50% 0;
`;

const GridPos = styled.div`
  position: absolute;
  bottom: 80px;
  right: 16px;
`;

/* --- types just for the local mock data --- */
type LbRow = {
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

export default function () {
  const [expanded, setExpanded] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [sideTab, setSideTab] = useState<"party" | "quest" | "target">("party");
  const [modal, setModal] = useState<ModalKey>(null);

  // mock data for now (wire to game state later)
  const roundTimeLeft = "0:54";
  const roundReward = "0.001 ZOD";

  const rows: LbRow[] = useMemo(
    () => [
      {
        player: "Zoey",
        rank: "#1",
        kills: 1,
        deaths: 0,
        evolves: 391,
        items: 0,
        sprites: 806,
        points: 10811,
        ping: "111MS",
      },
      {
        player: "Loffarn",
        rank: "#2",
        kills: 0,
        deaths: 0,
        evolves: 222,
        items: 0,
        sprites: 222,
        points: 10111,
        ping: "190MS",
      },
    ],
    []
  );

  const partyMembers = useMemo(
    () => [
      {
        name: "Zoey",
        level: 12,
        power: 12340,
        area: "Mage Isles",
        channel: "CH 1",
      },
      {
        name: "Loffarn",
        level: 10,
        power: 9930,
        area: "Mage Isles",
        channel: "CH 1",
      },
      {
        name: "Kira",
        level: 9,
        power: 8811,
        area: "Mage Isles",
        channel: "CH 2",
      },
    ],
    []
  );

  const quests = useMemo(
    () => [
      { title: "Win 1 round", progress: "0 / 1" },
      { title: "Collect 250 sprites", progress: "88 / 250" },
      { title: "Open 1 chest", progress: "0 / 1" },
    ],
    []
  );

  const targets = useMemo(
    () => [
      { name: "Enemy#5521", threat: "High", lastSeen: "Mid lane" },
      { name: "Enemy#1932", threat: "Med", lastSeen: "Top lane" },
    ],
    []
  );

  function openModal(k: ModalKey) {
    setModal(k);
  }

  function renderSideContent() {
    if (sideTab === "party") {
      return (
        <div>
          <SideTitle>PARTY</SideTitle>
          {partyMembers.map((m, idx) => (
            <div
              style={{
                marginBottom: idx === partyMembers.length - 1 ? "0px" : "10px",
              }}
            >
              <Lines>
                <Line>
                  <BodyCellGold>{m.name}</BodyCellGold> (Lv {m.level})
                </Line>
                <Line>Power: {m.power}</Line>
                <Line $last={true}>
                  {m.area} • {m.channel}
                </Line>
              </Lines>
            </div>
          ))}
        </div>
      );
    }

    if (sideTab === "quest") {
      return (
        <div>
          <SideTitle>QUESTS</SideTitle>
          {quests.map((q, idx) => (
            <div
              style={{
                marginBottom: idx === quests.length - 1 ? "0px" : "10px",
              }}
            >
              <Lines>
                <Line>
                  <BodyCellGold>{q.title}</BodyCellGold>
                </Line>
                <Line $last={true}>Progress: {q.progress}</Line>
              </Lines>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div>
        <SideTitle>TARGETS</SideTitle>
        {targets.map((t, idx) => (
          <div
            style={{
              marginBottom: idx === targets.length - 1 ? "0px" : "10px",
            }}
          >
            <Lines>
              <Line>
                <BodyCellGold>{t.name}</BodyCellGold>
              </Line>
              <Line>Threat: {t.threat}</Line>
              <Line $last={true}>Last seen: {t.lastSeen}</Line>
            </Lines>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Root>
      {/* TOP LEFT HUD */}
      <HudPos>
        <HudPanel>
          <HudTopRow>
            <HudTopLeft>
              <TimeText class="shadow-text">{roundTimeLeft}</TimeText>
              <TimeLabel>ROUND TIME LEFT</TimeLabel>
            </HudTopLeft>

            <HudTopRight>
              <RewardText class="shadow-text">{roundReward}</RewardText>
              <RewardLabel>ROUND REWARD</RewardLabel>
            </HudTopRight>
          </HudTopRow>

          <Divider />

          <BoardClick
            onPointerDown={() => setExpanded((v) => !v)}
            onPointerUp={() => {}}
            onPointerCancel={() => {}}
          >
            {/* HEADER */}
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

            {/* ROWS */}
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

      {/* TOP RIGHT MENU */}
      <TopRightPos>
        <MenuBox $open={menuOpen}>
          <MenuRow>
            <MenuItem
              $open={menuOpen}
              onPointerDown={() => openModal("Events")}
            >
              <MenuIconWrap $open={menuOpen}>
                <Icon src="/evolution/images/events.png" />
              </MenuIconWrap>
              <MenuLabel $open={menuOpen}>Events</MenuLabel>
            </MenuItem>

            <MenuItem $open={menuOpen} onPointerDown={() => openModal("Chest")}>
              <MenuIconWrap $open={menuOpen}>
                <Icon src="/evolution/images/chest.png" />
              </MenuIconWrap>
              <MenuLabel $open={menuOpen}>Chest</MenuLabel>
            </MenuItem>

            <MenuItem
              $open={menuOpen}
              onPointerDown={() => openModal("Inventory")}
            >
              <MenuIconWrap $open={menuOpen}>
                <Icon src="/evolution/images/inventory.png" />
              </MenuIconWrap>
              <MenuLabel $open={menuOpen}>Inventory</MenuLabel>
            </MenuItem>

            <MenuItem
              $open={menuOpen}
              onPointerDown={() => openModal("Market")}
            >
              <MenuIconWrap $open={menuOpen}>
                <Icon src="/evolution/images/market.png" />
              </MenuIconWrap>
              <MenuLabel $open={menuOpen}>Market</MenuLabel>
            </MenuItem>

            <MenuItem $open={true} onPointerDown={() => setMenuOpen((v) => !v)}>
              <MenuIconWrap $open={menuOpen}>
                <Icon src="/evolution/images/settings.png" />
              </MenuIconWrap>
              <MenuLabel $open={true}>
                {menuOpen ? "Close" : "Settings"}
              </MenuLabel>
            </MenuItem>

            {menuOpen ? (
              <div style={{ width: "100%", height: "10px" }} />
            ) : null}

            {menuOpen ? (
              <MenuItem
                $open={menuOpen}
                onPointerDown={() => openModal("Craft")}
              >
                <MenuIconWrap $open={menuOpen}>
                  <Icon src="/evolution/images/craft.png" />
                </MenuIconWrap>
                <MenuLabel $open={menuOpen}>Craft</MenuLabel>
              </MenuItem>
            ) : null}

            {menuOpen ? (
              <MenuItem
                $open={menuOpen}
                onPointerDown={() => openModal("Guild")}
              >
                <MenuIconWrap $open={menuOpen}>
                  <Icon src="/evolution/images/guild.png" />
                </MenuIconWrap>
                <MenuLabel $open={menuOpen}>Guild</MenuLabel>
              </MenuItem>
            ) : null}

            {menuOpen ? (
              <MenuItem
                $open={menuOpen}
                onPointerDown={() => openModal("Party")}
              >
                <MenuIconWrap $open={menuOpen}>
                  <Icon src="/evolution/images/party.png" />
                </MenuIconWrap>
                <MenuLabel $open={menuOpen}>Party</MenuLabel>
              </MenuItem>
            ) : null}

            {menuOpen ? (
              <MenuItem $open={menuOpen} onPointerDown={() => openModal("PVP")}>
                <MenuIconWrap $open={menuOpen}>
                  <Icon src="/evolution/images/pvp.png" />
                </MenuIconWrap>
                <MenuLabel $open={menuOpen}>PVP</MenuLabel>
              </MenuItem>
            ) : null}

            {menuOpen ? (
              <MenuItem
                $open={menuOpen}
                onPointerDown={() => openModal("Leaderboard")}
              >
                <MenuIconWrap $open={menuOpen}>
                  <Icon src="/evolution/images/leaderboard.png" />
                </MenuIconWrap>
                <MenuLabel $open={menuOpen}>Leaderboard</MenuLabel>
              </MenuItem>
            ) : null}

            {menuOpen ? (
              <MenuItem
                $open={menuOpen}
                onPointerDown={() => openModal("Settings")}
              >
                <MenuIconWrap $open={menuOpen}>
                  <Icon src="/evolution/images/settings.png" />
                </MenuIconWrap>
                <MenuLabel $open={menuOpen}>Settings</MenuLabel>
              </MenuItem>
            ) : null}
          </MenuRow>
        </MenuBox>
      </TopRightPos>

      {/* RIGHT SIDE 3 ICON RAIL + CONTENT */}
      <SidePos>
        <SideContent>{renderSideContent()}</SideContent>

        <SideRail>
          <RailBtn
            $active={sideTab === "quest"}
            onPointerDown={() => setSideTab("quest")}
          >
            <RailIconWrap $active={sideTab === "quest"}>
              <Icon src="/evolution/images/quest.png" />
            </RailIconWrap>
          </RailBtn>

          <RailSpacer />

          <RailBtn
            $active={sideTab === "party"}
            onPointerDown={() => setSideTab("party")}
          >
            <RailIconWrap $active={sideTab === "party"}>
              <Icon src="/evolution/images/party.png" />
            </RailIconWrap>
          </RailBtn>

          <RailSpacer />

          <RailBtn
            $active={sideTab === "target"}
            onPointerDown={() => setSideTab("target")}
          >
            <RailIconWrap $active={sideTab === "target"}>
              <Icon src="/evolution/images/target.png" />
            </RailIconWrap>
          </RailBtn>
        </SideRail>
      </SidePos>

      {/* BOTTOM CENTER: Action bar swiper */}
      <BarPos>
        <ActionBarSwiper
          onUse={onUseAction}
          globalCooldownSec={1}
          bars={bars}
        />
      </BarPos>

      {/* BOTTOM RIGHT: emote grid */}
      <GridPos>
        <ActionGrid actions={actions} onUse={onUseEmote} />
      </GridPos>

      {/* DUMMY MODAL */}
      {modal ? (
        <ModalShade onPointerDown={() => setModal(null)}>
          <ModalCard
            onPointerDown={(e) => {
              // Unity UIElements pointer events: StopPropagation (capital S)
              (e as any)?.StopPropagation?.();
            }}
          >
            <ModalHeader>
              <ModalTitle>{modal}</ModalTitle>
              <ModalClose onPointerDown={() => setModal(null)}>
                Close
              </ModalClose>
            </ModalHeader>

            <ModalBody>
              <Lines>
                <Line>
                  Dummy content for <BodyCellGold>{modal}</BodyCellGold>.
                </Line>
                <Line $last={true}>
                  Later: wire this to your real views (Market, Inventory,
                  Settings, etc).
                </Line>
              </Lines>
            </ModalBody>
          </ModalCard>
        </ModalShade>
      ) : null}
    </Root>
  );
}
