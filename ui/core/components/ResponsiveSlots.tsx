// sigil/ui/core/components/ResponsiveSlots.tsx
import { h } from "preact";
import styled from "../../../util/styled";

const MobileWrap = styled.div`
  /* default visible (mobile-first) */
  display: flex;
`;

const DesktopWrap = styled.div`
  /* default hidden (mobile-first) */
  display: none;
`;

export function MobileOnly(props: { children?: any }) {
  // IMPORTANT: must be a real element with class for Root selectors to target
  return <MobileWrap class="rsp-mobile">{props.children}</MobileWrap>;
}

export function DesktopOnly(props: { children?: any }) {
  return <DesktopWrap class="rsp-desktop">{props.children}</DesktopWrap>;
}
