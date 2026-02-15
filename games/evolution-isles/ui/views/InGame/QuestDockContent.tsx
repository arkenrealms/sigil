// sigil/ui/game/views/InGame/QuestDockContent.tsx
import { h } from "preact";
import { useMemo } from "preact/hooks";
import styled from "../../../../../util/styled";
import { Text } from "../../../../../ui/core/components/Text";

const Lines = styled.div`
  white-space: pre-line;
`;

const Line = styled.div<{ $last?: boolean }>`
  margin-bottom: ${(p) => (p.$last ? "0px" : "4px")};
`;

const Block = styled.div<{ $last?: boolean }>`
  margin-bottom: ${(p) => (p.$last ? "0px" : "10px")};
`;

const Title = styled.div`
  margin-bottom: 10px;
`;

type Quest = { title: string; progress: string };

function useDummyQuests(): Quest[] {
  return useMemo(
    () => [
      { title: "Win 1 round", progress: "0 / 1" },
      { title: "Collect 250 sprites", progress: "88 / 250" },
      { title: "Open 1 chest", progress: "0 / 1" },
    ],
    [],
  );
}

export function QuestDockContent() {
  const quests = useDummyQuests();

  return (
    <div>
      <Title>
        <Text size={18} bold color="#fff">
          QUESTS
        </Text>
      </Title>

      {quests.map((q, idx) => (
        <Block key={`${q.title}-${idx}`} $last={idx === quests.length - 1}>
          <Lines>
            <Line>
              <Text size={18} color="#fff">
                {q.title}
              </Text>
            </Line>
            <Line $last={true}>
              <Text size={18} color="#fff">
                Progress: {q.progress}
              </Text>
            </Line>
          </Lines>
        </Block>
      ))}
    </div>
  );
}
