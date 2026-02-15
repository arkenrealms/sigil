// sigil/ui/game/views/InGame/GameDockContent.tsx
import { h } from "preact";
import styled from "../../../../../util/styled";
import { Text } from "../../../../../ui/core/components/Text";

const Lines = styled.div`
  white-space: pre-line;
`;

const Line = styled.div<{ $last?: boolean }>`
  margin-bottom: ${(p) => (p.$last ? "0px" : "4px")};
`;

const Title = styled.div`
  margin-bottom: 10px;
`;

export type GameInfoLite = {
  gameMode?: string;
};

export function GameDockContent({ gameMode }: { gameMode?: string }) {
  return (
    <div>
      <Title>
        <Text size={18} bold color="#fff">
          GAME MODE
        </Text>
      </Title>

      {!gameMode ? (
        <Lines>
          <Line $last={true}>
            <Text size={18} color="#fff">
              Loading...
            </Text>
          </Line>
        </Lines>
      ) : (
        <Lines>
          <Line $last={true}>
            <Text size={22} bold color="rgb(214, 200, 78)">
              {gameMode.toUpperCase()}
            </Text>
          </Line>
        </Lines>
      )}
    </div>
  );
}
