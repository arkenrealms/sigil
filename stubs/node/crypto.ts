// src/stubs/node/crypto.ts
function notSupported(name: string): never {
  throw new Error(
    `[onejs] Node builtin "crypto" is not available in this runtime. Tried: ${name}`
  );
}

const cryptoStub = {
  createHash: () => notSupported("crypto.createHash"),
  randomBytes: () => notSupported("crypto.randomBytes"),
  createHmac: () => notSupported("crypto.createHmac"),
  pbkdf2Sync: () => notSupported("crypto.pbkdf2Sync"),
  // add more as needed
};

export default cryptoStub;
export const createHash = cryptoStub.createHash;
export const randomBytes = cryptoStub.randomBytes;
export const createHmac = cryptoStub.createHmac;
export const pbkdf2Sync = cryptoStub.pbkdf2Sync;
