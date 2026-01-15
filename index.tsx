// sigil/index.tsx
//
import { h, render } from "preact";
import "./polyfills/self";
import "./polyfills/base64";
import "./polyfills/text-decoder";
import "./polyfills/atob";
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

const App = () => {
  return <InGame />;
};

render(<App />, document.body as any);
