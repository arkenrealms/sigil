// sigil/index.tsx
//
import { h, render } from "preact";
import InGame from "./ui/game/views/InGame";

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
`);

declare const CS: any;

(globalThis as any).Arken ??= {
  Bridge: {
    emit(type: string, payload: any) {
      CS?.Arken?.Bridge?.Emit?.(String(type), JSON.stringify(payload));
    },
  },
};

const App = () => {
  return <InGame />;
};

render(<App />, document.body as any);
