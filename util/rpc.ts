// rpc.ts
//

class SimpleTextDecoder {
  constructor(_label: string = "utf-8") {}

  decode(input?: Uint8Array | ArrayBuffer): string {
    if (!input) return "";

    let bytes: Uint8Array;
    if (input instanceof Uint8Array) {
      bytes = input;
    } else if (input instanceof ArrayBuffer) {
      bytes = new Uint8Array(input);
    } else {
      throw new Error("[onejs] TextDecoder.decode: invalid input");
    }

    let out = "";
    for (let i = 0; i < bytes.length; ) {
      const c = bytes[i++];
      if (c < 0x80) {
        out += String.fromCharCode(c);
      } else if (c < 0xe0) {
        const c2 = bytes[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (c2 & 0x3f));
      } else {
        const c2 = bytes[i++];
        const c3 = bytes[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f)
        );
      }
    }
    return out;
  }
}

// Helper: detect BSON/Mongoose ObjectId-like values without importing mongoose/bson on the frontend
const isObjectIdLike = (v: any): boolean => {
  if (!v || typeof v !== "object") return false;

  // Native BSON ObjectId typically has _bsontype === 'ObjectId'
  if (v._bsontype === "ObjectId") return true;

  // Mongoose ObjectId usually has toHexString()
  if (typeof v.toHexString === "function") return true;

  // Fallback: many ObjectId implementations stringify to 24-hex
  const s = typeof v.toString === "function" ? v.toString() : "";
  return typeof s === "string" && /^[0-9a-fA-F]{24}$/.test(s);
};
// const serialized = serialize(obj);
// console.log(serialized);

// const deserialized = deserialize(serialized);
// console.log(deserialized);
// Define TypeScript types for serialization
type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable }
  | SerializedSpecialTypes;

interface SerializedSpecialTypes {
  _type: string;
  data: any;
  flags?: string; // For RegExp
}

// Serialize function
// Serialize function
export const serialize = <T>(object: T): string => {
  const seen = new WeakSet<object>();

  const processValue = (value: any): any => {
    // Fast-path primitives
    if (
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    // ✅ ObjectId -> string (Option A)
    // Must come early so it doesn't fall through to buffer-ish shapes.
    if (isObjectIdLike(value)) {
      const hex =
        typeof value.toHexString === "function"
          ? value.toHexString()
          : typeof value.toString === "function"
          ? value.toString()
          : String(value);
      return { _type: "ObjectId", data: hex };
    }

    // Special scalar-ish types
    if (typeof value === "bigint") {
      return { _type: "BigInt", data: value.toString() };
    }
    if (value instanceof Date) {
      return { _type: "Date", data: value.toISOString() };
    }
    if (value instanceof RegExp) {
      return { _type: "RegExp", data: value.source, flags: value.flags };
    }
    if (value instanceof ArrayBuffer) {
      return { _type: "ArrayBuffer", data: Array.from(new Uint8Array(value)) };
    }
    if (value instanceof Uint8Array) {
      return { _type: "Uint8Array", data: Array.from(value) };
    }
    if (value instanceof Set) {
      return { _type: "Set", data: Array.from(value).map(processValue) };
    }
    if (value instanceof Map) {
      return {
        _type: "Map",
        data: Array.from(value.entries()).map(([k, v]) => [k, processValue(v)]),
      };
    }

    // From here on we're dealing with objects/arrays
    if (typeof value !== "object") {
      return value;
    }

    // Cycle detection
    if (seen.has(value as object)) {
      return "[Circular]";
    }
    seen.add(value as object);

    // Normalize Mongoose documents (root or nested)
    // Mongoose docs have $__ and toJSON/toObject
    if ((value as any).$__ && typeof (value as any).toJSON === "function") {
      return processValue((value as any).toJSON());
    }

    // Arrays (including Mongoose arrays / document arrays)
    if (Array.isArray(value)) {
      return (value as any[]).map((item) => processValue(item));
    }

    // Plain-ish objects
    const entries = Object.entries(value).map(([k, v]) => [k, processValue(v)]);
    return Object.fromEntries(entries);
  };

  const processedObject = processValue(object);
  return JSON.stringify(processedObject);
};

// Deserialize function
export const deserialize = <T>(input: string | Serializable): T => {
  const processValue = (value: any): any => {
    if (!value) return value;
    if (Array.isArray(value)) return value.map((v) => processValue(v));
    if (typeof value !== "object") return value;

    const type =
      value._type ||
      (!["Object", "Array", "Date"].includes(value.constructor.name)
        ? value.constructor.name
        : undefined);

    if (type) {
      switch (type) {
        case "ArrayBuffer":
          return Uint8Array.from(value.data).buffer;
        case "Uint8Array":
          // console.log('deserialized result', 55555, type);

          return new Uint8Array(value.data);
        case "Date":
          return new Date(value.data);
        case "Set":
          return new Set(value.data.map(processValue));
        case "Map":
          return new Map(
            value.data.map(([k, v]: [any, any]) => [k, processValue(v)])
          );
        case "BigInt":
          return BigInt(value.data);
        case "RegExp":
          return new RegExp(value.data, value.flags);
        case "ObjectId":
          // ✅ Option A: keep as 24-hex string on the client
          return value.data;
      }
    }

    if (value.byteLength) {
      const decoder = new SimpleTextDecoder("utf-8");
      return JSON.parse(decoder.decode(value));
    } else if (value.constructor?.name === "Object" && value.buffer) {
      // console.log(
      //   'deserialized result',
      //   55555,
      //   type,
      //   value,
      //   String.fromCharCode.apply(null, processValue(value.buffer))
      // );

      return processValue(value.buffer);
    } else {
      const obj: any = {};
      for (const [k, v] of Object.entries(value)) {
        obj[k] = processValue(v);
      }
      return obj;
    }
  };

  const parsedInput = typeof input === "string" ? JSON.parse(input) : input;
  return processValue(parsedInput) as T;
};

export const transformer: any = {
  serialize,
  deserialize,
};

export const dummyTransformer: any = {
  serialize: (object: any): any => object,
  deserialize: (object: any): any => object,
};
