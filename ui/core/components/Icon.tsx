// sigil/ui/core/components/Icon.tsx
//
import { h } from "preact";
import styled from "../../../util/styled";
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

/* ───────────────────────────── */
/* styled components              */
/* ───────────────────────────── */

const Wrap = styled.div<{
  $w?: number;
  $h?: number;
}>`
  position: relative;

  width: ${(p) => (p.$w != null ? `${p.$w}px` : "100%")};
  height: ${(p) => (p.$h != null ? `${p.$h}px` : "100%")};
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

// Shadow layer: UI Toolkit–safe transforms
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

  filter: blur(2px) grayscale(1) tint(#000);
`;

/* ───────────────────────────── */
/* component                      */
/* ───────────────────────────── */

export function Icon(props: {
  src?: string;

  /** Optional fixed size (px). If omitted → fills parent */
  width?: number;
  height?: number;

  /** Shadow rendering */
  shadow?: boolean;
  shadowDx?: number;
  shadowDy?: number;
  shadowScale?: number;
  shadowOpacity?: number;
}) {
  const {
    src,

    width,
    height,

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
    <Wrap $w={width} $h={height}>
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
