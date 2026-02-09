// arken/sigil/util/dsl/interactionDsl.ts
//
// Parses + executes a tiny "interaction DSL" embedded in a GameObject name.
//
// Example:
//   Portal~OnClick(Play("Evolution").Navigate("/market")).OnDrag(Rotate(15))
//
// Notes:
// - No JS eval. Only literal args + JSON objects/arrays.
// - Pipeline chaining uses '.' INSIDE OnClick(...)
// - Handler chaining uses '.' OUTSIDE OnClick(...)
// - Multiple pipelines per handler are comma-separated:
//     OnClick(Play("Evolution"), Navigate("/market"))
//
// Output envelope shape:
//   {
//     label: "Portal",
//     events: {
//       OnClick: [ { calls: [ {fn,args}, {fn,args} ] } ],
//       OnDrag:  [ ... ],
//     }
//   }

type DslCall = { fn: string; args: any[] };
type DslPipeline = { calls: DslCall[] };
export type DslEnvelope = {
  label: string;
  raw: string;
  events: Record<string, DslPipeline[]>;
};

function isWs(ch: string) {
  return ch === " " || ch === "\n" || ch === "\r" || ch === "\t";
}

function isIdentStart(ch: string) {
  const c = ch.charCodeAt(0);
  return (
    (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || ch === "_" || ch === "$"
  );
}
function isIdent(ch: string) {
  const c = ch.charCodeAt(0);
  return isIdentStart(ch) || (c >= 48 && c <= 57);
}

class P {
  s: string;
  i = 0;
  constructor(s: string) {
    this.s = s ?? "";
  }
  eof() {
    return this.i >= this.s.length;
  }
  peek() {
    return this.s[this.i] ?? "";
  }
  next() {
    return this.s[this.i++] ?? "";
  }
  skipWs() {
    while (!this.eof() && isWs(this.peek())) this.i++;
  }
  tryConsume(ch: string) {
    this.skipWs();
    if (this.peek() === ch) {
      this.i++;
      return true;
    }
    return false;
  }
  expect(ch: string) {
    this.skipWs();
    const got = this.next();
    if (got !== ch)
      throw new Error(
        `Expected '${ch}' but got '${got || "EOF"}' at ${this.i}`,
      );
  }
  readIdent() {
    this.skipWs();
    const start = this.i;
    if (!isIdentStart(this.peek())) return "";
    this.i++;
    while (!this.eof() && isIdent(this.peek())) this.i++;
    return this.s.slice(start, this.i);
  }

  readString(): string {
    this.skipWs();
    const q = this.peek();
    if (q !== `"` && q !== `'`) throw new Error(`Expected string at ${this.i}`);
    this.i++; // consume quote
    let out = "";
    while (!this.eof()) {
      const ch = this.next();
      if (ch === q) break;
      if (ch === "\\") {
        const n = this.next();
        if (n === "n") out += "\n";
        else if (n === "r") out += "\r";
        else if (n === "t") out += "\t";
        else if (n === `"`) out += `"`;
        else if (n === `'`) out += `'`;
        else if (n === "\\") out += "\\";
        else out += n; // loose
      } else {
        out += ch;
      }
    }
    return out;
  }

  readNumber(): number {
    this.skipWs();
    const start = this.i;
    if (this.peek() === "-") this.i++;
    while (!this.eof()) {
      const ch = this.peek();
      const c = ch.charCodeAt(0);
      if (c >= 48 && c <= 57) this.i++;
      else break;
    }
    if (this.peek() === ".") {
      this.i++;
      while (!this.eof()) {
        const ch = this.peek();
        const c = ch.charCodeAt(0);
        if (c >= 48 && c <= 57) this.i++;
        else break;
      }
    }
    const raw = this.s.slice(start, this.i);
    const n = Number(raw);
    if (!Number.isFinite(n)) throw new Error(`Bad number '${raw}' at ${start}`);
    return n;
  }

  // Reads {...} or [...] as JSON (must be valid JSON, i.e. double quotes for keys/strings).
  readJsonAny(): any {
    this.skipWs();
    const open = this.peek();
    if (open !== "{" && open !== "[")
      throw new Error(`Expected JSON object/array at ${this.i}`);

    const start = this.i;
    let depth = 0;
    let inStr = false;
    let strQ = "";

    while (!this.eof()) {
      const ch = this.next();
      if (inStr) {
        if (ch === "\\") {
          this.next(); // skip escaped
          continue;
        }
        if (ch === strQ) {
          inStr = false;
          strQ = "";
        }
        continue;
      } else {
        if (ch === `"`) {
          inStr = true;
          strQ = `"`;
          continue;
        }
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        else if (ch === "[") depth++;
        else if (ch === "]") depth--;
        if (depth === 0) break; // closed the top-level object/array
      }
    }

    const raw = this.s.slice(start, this.i);
    try {
      return JSON.parse(raw);
    } catch (e: any) {
      throw new Error(`Invalid JSON arg: ${raw} (${String(e?.message ?? e)})`);
    }
  }

  readLiteral(): any {
    this.skipWs();
    const ch = this.peek();

    // string
    if (ch === `"` || ch === `'`) return this.readString();

    // json
    if (ch === "{" || ch === "[") return this.readJsonAny();

    // number
    if (ch === "-" || (ch >= "0" && ch <= "9")) return this.readNumber();

    // keywords
    const id = this.readIdent();
    if (id === "true") return true;
    if (id === "false") return false;
    if (id === "null") return null;

    // If you want to allow bare identifiers as strings, uncomment:
    // if (id) return id;

    throw new Error(
      `Unsupported arg at ${this.i} near '${this.s.slice(this.i, this.i + 16)}'`,
    );
  }
}

function parseCall(p: P): DslCall {
  const fn = p.readIdent();
  if (!fn) throw new Error(`Expected call identifier at ${p.i}`);
  p.expect("(");

  const args: any[] = [];
  p.skipWs();
  if (!p.tryConsume(")")) {
    while (true) {
      args.push(p.readLiteral());
      p.skipWs();
      if (p.tryConsume(")")) break;
      p.expect(",");
    }
  }

  return { fn, args };
}

function parsePipeline(p: P): DslPipeline {
  const calls: DslCall[] = [];
  calls.push(parseCall(p));

  // pipeline chaining: .NextCall(...)
  while (true) {
    p.skipWs();
    if (!p.tryConsume(".")) break;
    calls.push(parseCall(p));
  }

  return { calls };
}

function parseHandlerArgs(p: P): DslPipeline[] {
  // assumes '(' is next
  p.expect("(");

  const pipes: DslPipeline[] = [];
  p.skipWs();

  if (p.tryConsume(")")) return pipes; // empty handler: OnClick()

  while (true) {
    pipes.push(parsePipeline(p));
    p.skipWs();
    if (p.tryConsume(")")) break;
    p.expect(","); // next pipeline
  }

  return pipes;
}

export function tryParseInteractionDsl(name: string): DslEnvelope | null {
  const s = String(name ?? "");
  const tilde = s.indexOf("~");
  if (tilde < 0) return null;

  const label = s.slice(0, tilde).trim();
  const rest = s.slice(tilde + 1);

  const p = new P(rest);
  const events: Record<string, DslPipeline[]> = {};

  while (!p.eof()) {
    p.skipWs();
    const evt = p.readIdent();
    if (!evt) break;

    const pipelines = parseHandlerArgs(p);
    events[evt] = (events[evt] ?? []).concat(pipelines);

    p.skipWs();
    // handler chaining: .OnDrag(...)
    if (!p.tryConsume(".")) break;
  }

  return { label, raw: s, events };
}

// ------------------------------
// Execution
// ------------------------------

export type DslExecContext = {
  app: any;
  // The clicked/dragged object (Unity-side), if you forward it
  go?: any;
  // You can add more later (hit point, normal, etc)
};

type ActionFn = (args: any[], ctx: DslExecContext) => any | Promise<any>;

export type DslActionRegistry = Record<string, ActionFn>;

export function createDefaultDslActions(): DslActionRegistry {
  return {
    // Play("Evolution")
    Play: async (args, ctx) => {
      const gameKey = String(args?.[0] ?? "");
      if (!gameKey) throw new Error("Play requires a gameKey string");
      // uses your existing util (imported by callers)
      // the caller should pass in a bound action if you want direct import-less usage
      if (typeof ctx.app?.service?.core?.Play === "function") {
        return ctx.app.service.core.Play(gameKey);
      }
      // fallback: if you kept onChangeGame util accessible somewhere, override via registry injection
      throw new Error(
        "Play action not bound (provide app.service.core.Play or override action)",
      );
    },

    // Navigate("/market")
    Navigate: async (args, _ctx) => {
      const path = String(args?.[0] ?? "/");
      try {
        CS.Arken.Bridge.Instance.NavigateWeb(path);
      } catch (e) {
        console.warn("Navigate failed:", e);
      }
    },

    // Rotate(15)  (placeholder: implement however you want)
    Rotate: async (args, ctx) => {
      const deg = Number(args?.[0] ?? 0);
      if (!Number.isFinite(deg)) return;
      if (typeof ctx.app?.service?.game?.rotate === "function") {
        return ctx.app.service.game.rotate(deg, ctx);
      }
      // no-op by default
    },
  };
}

export async function execDslEvent(
  env: DslEnvelope,
  eventName: string,
  ctx: DslExecContext,
  actions: DslActionRegistry,
) {
  const pipelines = env?.events?.[eventName];
  if (!Array.isArray(pipelines) || pipelines.length === 0) return;

  // deterministic: pipelines execute in order
  for (const pipe of pipelines) {
    const calls = pipe?.calls ?? [];
    for (const call of calls) {
      const fn = String(call?.fn ?? "");
      const act = actions[fn];
      if (!act) {
        console.warn(`[dsl] unknown call '${fn}' in ${env.raw}`);
        continue;
      }
      await act(call.args ?? [], ctx);
    }
  }
}
