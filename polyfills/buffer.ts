// No "declare global Buffer" here on purpose (avoid @types/node conflicts)

type Buf = Uint8Array & {
  toString(encoding?: "utf8" | "hex" | "base64" | "binary"): string;
};

export function installBufferPolyfill(): void {
  const g: any = globalThis as any;
  if (typeof g.Buffer !== "undefined") return;

  function makeBuf(bytes: Uint8Array): Buf {
    const b = bytes as Buf;
    b.toString = (encoding: "utf8" | "hex" | "base64" | "binary" = "utf8") => {
      if (encoding === "hex") return bytesToHex(bytes);
      if (encoding === "base64") return bytesToBase64(bytes);
      if (encoding === "binary") return bytesToBinaryString(bytes);
      return utf8BytesToString(bytes);
    };
    return b;
  }

  g.Buffer = {
    from(
      input: any,
      encoding: "utf8" | "hex" | "base64" | "binary" = "utf8"
    ): Buf {
      if (typeof input === "string") {
        if (encoding === "base64") return makeBuf(base64ToBytes(input));
        if (encoding === "hex") return makeBuf(hexToBytes(input));
        if (encoding === "binary") return makeBuf(binaryStringToBytes(input));
        return makeBuf(stringToUtf8Bytes(input));
      }

      if (input instanceof Uint8Array) return makeBuf(new Uint8Array(input));
      if (Array.isArray(input)) return makeBuf(new Uint8Array(input));

      throw new Error("[onejs] Buffer.from: unsupported input");
    },

    // Optional: many libs check this
    isBuffer(x: any) {
      return x instanceof Uint8Array && typeof x.toString === "function";
    },
  };
}

/* ---------------- helpers ---------------- */

function stringToUtf8Bytes(str: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) {
      out.push(0xc0 | (c >> 6));
      out.push(0x80 | (c & 63));
    } else {
      out.push(0xe0 | (c >> 12));
      out.push(0x80 | ((c >> 6) & 63));
      out.push(0x80 | (c & 63));
    }
  }
  return new Uint8Array(out);
}

function utf8BytesToString(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const c = bytes[i++];
    if (c < 128) out += String.fromCharCode(c);
    else if (c > 191 && c < 224) {
      const c2 = bytes[i++];
      out += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
    } else {
      const c2 = bytes[i++];
      const c3 = bytes[i++];
      out += String.fromCharCode(
        ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
      );
    }
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2)
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++)
    out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

const b64chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function base64ToBytes(input: string): Uint8Array {
  input = String(input).replace(/\s+/g, "");
  let buffer = 0,
    bits = 0;
  const out: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const c = input.charAt(i);
    if (c === "=") break;
    const val = b64chars.indexOf(c);
    if (val < 0) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const n = (a << 16) | (b << 8) | c;
    out += b64chars[(n >> 18) & 63];
    out += b64chars[(n >> 12) & 63];
    out += i + 1 < bytes.length ? b64chars[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? b64chars[n & 63] : "=";
  }
  return out;
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

function binaryStringToBytes(str: string): Uint8Array {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}
