export function isValidAuth(auth: any) {
  const addr = auth?.address;
  const token = auth?.token;

  if (!addr || !token) return false;
  if (addr === "undefined" || token === "undefined") return false;
  if (addr === "null" || token === "null") return false;
  if (typeof addr !== "string" || typeof token !== "string") return false;

  // optional: basic address sanity
  if (!addr.startsWith("0x") || addr.length < 10) return false;
  if (!token.startsWith("0x") || token.length < 10) return false;

  return true;
}
