// sigil/ui/core/components/Icon.tsx
//
import { h } from "preact";
import styled from "preact/styled";
import { useEffect, useState } from "preact/hooks";

declare const CS: any;
declare const resource: any;

const WEB_BASE = "https://alpha.arken.gg";

function resolveRemoteUrl(src: string): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("//")) return "https:" + src;
  if (src.startsWith("/")) return WEB_BASE.replace(/\/+$/, "") + src;
  return WEB_BASE.replace(/\/+$/, "") + "/" + src.replace(/^\/+/, "");
}

function toAssetRelPath(remoteUrl: string): string {
  const m = remoteUrl.match(/^https?:\/\/[^/]+(\/.*)$/i);
  const path = (m && m[1] ? m[1] : remoteUrl).replace(/^\/+/, "");
  return `assets/${path}`;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function ensureCached(remoteUrl: string, assetRel: string) {
  const wc = CS.Arken.Web.WebCommunicator;
  wc.EnsureOneJsAsset(remoteUrl, assetRel);

  const fullPath = wc.GetOneJsFullPath(assetRel);
  const File = CS.System.IO.File;

  for (let i = 0; i < 240; i++) {
    if (File.Exists(fullPath)) return;
    await sleep(16);
  }
  throw new Error(`Timed out caching: ${remoteUrl} -> ${assetRel}`);
}

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const Layer = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;

  background-size: cover;
  background-position: center;
`;

// Shadow layer: uses UI Toolkit supported transform props
const ShadowLayer = styled.div<{
  $dx: number;
  $dy: number;
  $scale: number;
  $opacity: number;
}>`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;

  background-size: cover;
  background-position: center;

  opacity: ${(p) => p.$opacity};
  translate: ${(p) => `${p.$dx}px ${p.$dy}px`};
  scale: ${(p) => p.$scale} ${(p) => p.$scale};
  transform-origin: 50% 50%;

  /* these are "best effort" — if your USS/UITK parser supports them, great */
  filter: blur(2px) grayscale(1) tint(#000);
`;

export function Icon(props: {
  src?: string;

  /** If true, render a duplicated dark "shadow" under the icon */
  shadow?: boolean;

  /** Optional tuning (only used when shadow=true) */
  shadowDx?: number; // px
  shadowDy?: number; // px
  shadowScale?: number; // 1.0 = same size
  shadowOpacity?: number; // 0..1
}) {
  const {
    src,
    shadow = false,
    shadowDx = 2,
    shadowDy = 2,
    shadowScale = 1.1,
    shadowOpacity = 0.6,
  } = props;

  const [bg, setBg] = useState<any>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!src) {
        if (alive) setBg(null);
        return;
      }

      const remoteUrl = resolveRemoteUrl(src);
      const assetRel = toAssetRelPath(remoteUrl);

      await ensureCached(remoteUrl, assetRel);

      const tex = resource.loadImage(assetRel);
      if (alive) setBg(tex);
    })().catch((e: any) => {
      console.log("[Icon] failed:", src, e?.message || e);
    });

    return () => {
      alive = false;
    };
  }, [src]);

  const style = bg ? { backgroundImage: bg } : undefined;

  return (
    <Wrap>
      {shadow ? (
        <ShadowLayer
          $dx={shadowDx}
          $dy={shadowDy}
          $scale={shadowScale}
          $opacity={shadowOpacity}
          style={style}
        />
      ) : null}

      <Layer style={style} />
    </Wrap>
  );
}
