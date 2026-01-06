// sigil/ui/core/components/Text.tsx
//
import { h } from "preact";
import styled from "../../../util/styled";

type TextAlign = "left" | "center" | "right";

function px(v?: number | string): string | undefined {
  if (v == null) return undefined;
  return typeof v === "number" ? `${v}px` : v;
}

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
`;

const Layer = styled.div`
  white-space: pre-wrap;
`;

const ShadowLayer = styled.div<{
  $dx: number;
  $dy: number;
  $opacity: number;
  $blur: number;
}>`
  white-space: pre-wrap;
  position: absolute;
  left: 0px;
  top: 0px;

  opacity: ${(p) => p.$opacity};
  translate: ${(p) => `${p.$dx}px ${p.$dy}px`};
  transform-origin: 0% 0%;

  filter: blur(${(p) => p.$blur}px) tint(#000);
`;

export function Text(props: {
  children?: any;

  // styling
  size?: number | string; // number -> px
  color?: string;
  bold?: boolean;
  align?: TextAlign;

  // shadow
  shadow?: boolean;
  shadowDx?: number;
  shadowDy?: number;
  shadowOpacity?: number; // 0..1
  shadowBlur?: number; // px (best-effort)

  // misc
  style?: any;
}) {
  const {
    children,
    size,
    color,
    bold = false,
    align,

    shadow = false,
    shadowDx = 2,
    shadowDy = 2,
    shadowOpacity = 0.8,
    shadowBlur = 1,

    style,
  } = props;

  const baseStyle: any = {
    fontSize: px(size),
    color: color,
    ...(bold ? { ["-unity-font-style"]: "bold" } : null),
    ...(align ? { ["-unity-text-align"]: align } : null),
    ...style,
  };

  return (
    <Wrap>
      {shadow ? (
        <ShadowLayer
          $dx={shadowDx}
          $dy={shadowDy}
          $opacity={shadowOpacity}
          $blur={shadowBlur}
          style={baseStyle}
        >
          {children}
        </ShadowLayer>
      ) : null}

      <Layer style={baseStyle}>{children}</Layer>
    </Wrap>
  );
}
