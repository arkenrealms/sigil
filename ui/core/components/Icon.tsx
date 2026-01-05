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

const Root = styled.div`
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
` as any;

export function Icon(props: { src?: string }) {
  const [bg, setBg] = useState<any>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!props.src) return;

      const remoteUrl = resolveRemoteUrl(props.src);
      const assetRel = toAssetRelPath(remoteUrl);

      await ensureCached(remoteUrl, assetRel);

      const tex = resource.loadImage(assetRel);
      if (alive) setBg(tex);
    })().catch((e: any) => {
      console.log("[Icon] failed:", props.src, e?.message || e);
    });

    return () => {
      alive = false;
    };
  }, [props.src]);

  return <Root style={bg ? { backgroundImage: bg } : undefined} />;
}
