// sigil/index.tsx
//
import { h, render } from "preact";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { trpc, trpcClient, queryClient } from "./util/trpc";
// import "./polyfills/self";
import "./polyfills/abort-controller";
// import "./polyfills/base64";
// import "./polyfills/text-decoder";
// import "./polyfills/atob";
import EntryView from "./ui/game/views/Entry";
import EvolutionIslesInGameView from "./games/evolution-isles/ui/views/InGame";
import { getApp } from "./appInstance";
import { useAppSettings } from "./hooks/useAppSettings";

// declare const process: any;

// if (typeof process !== "undefined" && process?.on) {
//   process.on("unhandledRejection", (reason: any, p: any) => {
//     console.error("[unhandledRejection]", reason);
//     if (reason?.stack) console.error(reason.stack);
//   });

//   process.on("uncaughtException", (err: any) => {
//     console.error("[uncaughtException]", err);
//     if (err?.stack) console.error(err.stack);
//   });
// }

document.addRuntimeUSS?.(`
  .shadow-text {
    -unity-text-outline-color: rgba(0,0,0,0.55);
    -unity-text-outline-width: 1px;
  }

  /* Mobile-first: show mobile wrappers, hide desktop wrappers */
  .rsp-mobile {
    display: flex;
  }
  .rsp-desktop {
    display: none;
  }

  /* Treat >= lg as "desktop" */
  .root.onejs-bp-lg .rsp-mobile {
    display: none;
  }
  .root.onejs-bp-xl .rsp-mobile {
    display: none;
  }
  .root.onejs-bp-xxl .rsp-mobile {
    display: none;
  }

  .root.onejs-bp-lg .rsp-desktop {
    display: flex;
  }
  .root.onejs-bp-xl .rsp-desktop {
    display: flex;
  }
  .root.onejs-bp-xxl .rsp-desktop {
    display: flex;
  }


.ui-zoom-slider {
  width: 260px;
  height: 18px;
  margin-top: 6px;
  margin-bottom: 6px;
}

/* A simple reset "button" */
.ui-zoom-reset {
  padding: 6px 10px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  -unity-font-style: bold;
}
`);

const app = getApp();

const App = () => {
  const settings = useAppSettings(app);

  return settings.gameKey === "evolution-isles" ? (
    <EvolutionIslesInGameView app={app} />
  ) : settings.gameKey === "heart-of-the-oasis" ? (
    <EvolutionIslesInGameView app={app} />
  ) : settings.gameKey === "return-to-the-oasis" ? (
    <EntryView app={app} />
  ) : (
    /* @ts-ignore */
    <EntryView app={app} />
  );
};

// <trpc.Provider client={trpcClient} queryClient={queryClient}>
//   <QueryClientProvider client={queryClient}>
//     <InGame />
//   </QueryClientProvider>
// </trpc.Provider>

render(<App />, document.body as any);
