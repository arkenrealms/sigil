// sigil/ui/game/views/InGame.tsx
//
import { h, render } from "preact";
import styled from "preact/styled";
import { ActionBar } from "../../actions/components/ActionBar";
import { ActionGrid } from "../../actions/components/ActionGrid";

const onUseAction = (actionId: string) =>
  (globalThis as any).Arken.Bridge.emit("action", actionId);
const onUseEmote = (emoteId: string) =>
  (globalThis as any).Arken.Bridge.emit("emote", emoteId);

const Root = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

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

export default function () {
  return (
    <Root>
      <BarPos>
        <ActionBar
          actions={[
            {
              id: "adsada2",
              keybind: "1",
              src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/87792/fireball-red-1.png",
              name: "Fireball",
              cooldown: 10,
              globalCooldown: 1,
              isSelf: true,
            },
            {
              id: "adsada3",
              keybind: "2",
              src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/87792/evil-eye-eerie-3.png",
              name: "Evil Eye",
              cooldown: 10,
              globalCooldown: 1,
              isSelf: true,
            },
            {
              id: "adsada4",
              keybind: "3",
              src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/87792/protect-orange-3.png",
              name: "Protect",
              cooldown: 10,
              globalCooldown: 1,
              isSelf: true,
            },
            {
              id: "adsada5",
              keybind: "4",
              src: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/87792/fireball-acid-3.png",
              name: "Acid Ball",
              cooldown: 10,
              globalCooldown: 1,
              isSelf: false,
            },
          ]}
          onUse={onUseAction}
          globalCooldownSec={1}
        />
      </BarPos>

      <GridPos>
        <ActionGrid
          actions={[
            { id: "10001", name: "None", src: "/images/skills/10001.png" },
            { id: "10002", name: "Sigh", src: "/images/skills/10002.png" },
            { id: "10003", name: "Question", src: "/images/skills/10003.png" },
            { id: "10004", name: "Sweat", src: "/images/skills/10004.png" },
            { id: "10005", name: "Idea", src: "/images/skills/10005.png" },
            { id: "10006", name: "Whisper", src: "/images/skills/10006.png" },
            { id: "10007", name: "Happy", src: "/images/skills/10007.png" },
            { id: "10008", name: "Anger", src: "/images/skills/10008.png" },
            { id: "10009", name: "Sad", src: "/images/skills/10009.png" },
            { id: "10010", name: "Laugh", src: "/images/skills/10010.png" },
            { id: "10011", name: "Shock", src: "/images/skills/10011.png" },
            { id: "10012", name: "Excited", src: "/images/skills/10012.png" },
            { id: "10013", name: "Finger", src: "/images/skills/10013.png" },
            { id: "10014", name: "Nervous", src: "/images/skills/10014.png" },
            { id: "10015", name: "Greedy", src: "/images/skills/10015.png" },
            { id: "10016", name: "Proud", src: "/images/skills/10016.png" },
            { id: "10017", name: "Heart", src: "/images/skills/10017.png" },
            { id: "10018", name: "Dispirit", src: "/images/skills/10018.png" },
            { id: "10019", name: "Shy", src: "/images/skills/10019.png" },
          ]}
          onUse={onUseEmote}
        />
      </GridPos>
    </Root>
  );
}
