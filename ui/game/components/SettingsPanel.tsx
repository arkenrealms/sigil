import { h } from "preact";
import styled from "../../../util/styled";
import { Slider } from "../../core/components/Slider";
import { setUiZoomPercent, useUiZoomPercent } from "../state/useUiZoom";

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
`;

const Title = styled.div`
  font-size: 14px;
  -unity-font-style: bold;
  color: rgba(255, 255, 255, 0.9);
`;

const Value = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
`;

const Spacer = styled.div`
  height: 10px;
`;

const Help = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
`;

const ResetBtn = styled.div`
  padding: 6px 10px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  -unity-font-style: bold;
`;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function snap(n: number, step: number) {
  if (step <= 0) return n;
  return Math.round(n / step) * step;
}

export function SettingsPanel() {
  const zoom = useUiZoomPercent(); // 0..200

  return (
    <Wrap>
      {/* <Row>
        <Title>Settings</Title>
      </Row>

      <Spacer /> */}

      {/* slider is 0..200, we snap to 1% steps */}
      <Slider
        min={50}
        max={150}
        value={zoom}
        onChange={(v) => {
          if (!Number.isFinite(v)) return;
          setUiZoomPercent(clamp(Math.round(v), 50, 150));
        }}
      />

      <Row style={{ marginTop: "10px" } as any}>
        <Help></Help>
        <ResetBtn onPointerDown={() => setUiZoomPercent(100)}>Reset</ResetBtn>
      </Row>
    </Wrap>
  );
}
