// sigil/index.tsx
//
import { h, render } from "preact";
import InGame from "./ui/game/views/InGame";

document.addRuntimeUSS?.(`
.shadow-text {
  -unity-text-outline-color: rgba(0,0,0,0.55);
  -unity-text-outline-width: 1px;
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
