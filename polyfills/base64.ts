// src/polyfills/base64.ts

// declare global {
//   // eslint-disable-next-line no-var
//   var atob: ((data: string) => string) | undefined;
//   // eslint-disable-next-line no-var
//   var btoa: ((data: string) => string) | undefined;
// }

const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function atobPolyfill(input: string): string {
  // Remove whitespace
  input = String(input).replace(/\s+/g, "");
  if (input.length % 4 === 1) {
    throw new Error("[onejs] Invalid base64 string");
  }

  let output = "";
  let bc = 0,
    bs = 0,
    buffer = 0;

  for (let i = 0; i < input.length; i++) {
    const c = input.charAt(i);
    if (c === "=") break;

    const idx = chars.indexOf(c);
    if (idx === -1) continue;

    buffer = (buffer << 6) | idx;
    bs += 6;

    if (bs >= 8) {
      bs -= 8;
      const byte = (buffer >> bs) & 0xff;
      output += String.fromCharCode(byte);
      bc++;
    }
  }

  return output;
}

function btoaPolyfill(input: string): string {
  input = String(input);
  let output = "";
  let i = 0;

  while (i < input.length) {
    const c1 = input.charCodeAt(i++) & 0xff;
    const c2 = i < input.length ? input.charCodeAt(i++) & 0xff : NaN;
    const c3 = i < input.length ? input.charCodeAt(i++) & 0xff : NaN;

    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const e3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6);
    const e4 = isNaN(c3) ? 64 : c3 & 63;

    output +=
      chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + chars.charAt(e4);
  }

  return output;
}

if (typeof globalThis.atob !== "function") globalThis.atob = atobPolyfill;
if (typeof globalThis.btoa !== "function") globalThis.btoa = btoaPolyfill;

export {};
