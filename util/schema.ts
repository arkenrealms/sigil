// arken/packages/node/schema.ts
//
import Mongoose, { Types } from "mongoose";
import { z as zod, ZodTypeAny, ZodLazy, ZodObject, ZodArray } from "zod";
import {
  AnyProcedure,
  inferProcedureOutput,
  AnyRouter,
  AnyTRPCClientTypes,
  TRPCRouterRecord,
} from "@trpc/server";

export type { inferRouterInputs } from "@trpc/server";

export const z = zod;

// @ts-ignore
export const ObjectId = z.union([
  z.string().refine((value) => Mongoose.isValidObjectId(value), {
    // Accept valid ObjectId strings
    message: "Invalid ObjectId",
  }),
  z.instanceof(Types.ObjectId), // Accept Mongoose ObjectId instances
]);

export const Anything = z.any();
export const Nothing = z.object({});
export const Signature = z.object({ hash: z.string(), address: z.string() });
export const UnsignedData = z.object({ data: z.any() });
export const SignedData = z.object({
  data: z.any(),
  signature: Signature,
});

export const AnyInput = z.any();
export const OnlySignatureInput = z.object({ signature: Signature });
export const NoDataOutput = z.object({ status: z.number() });
export const AnyDataOutput = z.object({ data: z.any(), status: z.number() });

export enum Status {
  Paused = "Paused",
  Pending = "Pending",
  Active = "Active",
  Archived = "Archived",
}

export type Meta = {
  [key: string]: unknown;
};

export const Common = z.object({
  id: ObjectId.optional(),
  meta: z.any(), // Default value set here matches Mongoose
  data: z.any(), // Default value set here matches Mongoose
  status: z.enum(["Paused", "Pending", "Active", "Archived"]).default("Active"), // Default set in StatusEnum matches Mongoose
  merkleLeaf: z.string().optional(),
  merkleIndex: z.number().optional(),
  createdById: ObjectId.optional(),
  editedById: ObjectId.optional(),
  deletedById: ObjectId.optional(),
  createdDate: z.date().default(() => new Date()), // Default matches Mongoose
  updatedDate: z.date().optional(),
  deletedDate: z.date().optional(),
});

export type Common = zod.infer<typeof Common>;

export const Entity = z
  .object({
    id: z.string().min(24).max(24).trim().optional(),
    key: z.string().min(1).max(200).trim().optional(),
    name: z.string().min(1).max(200).trim().optional(),
    description: z.string().optional(),
    applicationId: ObjectId.optional(),
    ownerId: ObjectId.optional(),
  })
  .merge(Common);

export type Entity = zod.infer<typeof Entity>;

const QueryFilterOperators = z.object({
  equals: z.any().optional(),
  not: z.any().optional(),
  in: z.array(z.any()).optional(),
  notIn: z.array(z.any()).optional(),
  lt: z.any().optional(),
  lte: z.any().optional(),
  gt: z.any().optional(),
  gte: z.any().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.enum(["default", "insensitive"]).optional(),
});

const QueryWhereSchema = z.lazy(() =>
  z.object({
    AND: z.array(QueryWhereSchema).optional(),
    OR: z.array(QueryWhereSchema).optional(),
    NOT: z.array(QueryWhereSchema).optional(),
    id: QueryFilterOperators.optional(),
    key: QueryFilterOperators.optional(),
    name: QueryFilterOperators.optional(),
    email: QueryFilterOperators.optional(),
    status: QueryFilterOperators.optional(),
  }),
);

export const Query = z.object({
  skip: z.number().default(0).optional(),
  take: z.number().default(10).optional(),
  cursor: z.record(z.any()).optional(),
  where: QueryWhereSchema.optional(),
  orderBy: z.record(z.enum(["asc", "desc"])).optional(),
  include: z.record(z.boolean()).optional(),
  select: z.record(z.boolean()).optional(),
});

// // Operators for filtering in a Prisma-like way
// type PrismaFilterOperators<T extends ZodTypeAny> = zod.ZodObject<
//   {
//     equals?: T;
//     not?: T;
//     in?: zod.ZodArray<T>;
//     notIn?: zod.ZodArray<T>;
//     lt?: T;
//     lte?: T;
//     gt?: T;
//     gte?: T;
//     contains?: zod.ZodString; // T extends zod.ZodString ? zod.ZodString : never;
//     startsWith?: zod.ZodString; // T extends zod.ZodString ? zod.ZodString : never;
//     endsWith?: zod.ZodString; // T extends zod.ZodString ? zod.ZodString : never;
//     mode?: zod.ZodString; // T extends zod.ZodString ? zod.ZodEnum<['default', 'insensitive']> : never;
//   },
//   'strip',
//   ZodTypeAny
// >;

// // Level 0: No AND, OR, NOT
// type PrismaWhereLevel0<T extends zod.ZodRawShape> = ZodObject<
//   {
//     [K in keyof T]?: PrismaFilterOperators<T[K]>;
//   },
//   'strip',
//   ZodTypeAny
// >;

// // Level 1: Includes AND, OR, NOT of Level 0
// type PrismaWhereLevel1<T extends zod.ZodRawShape> = ZodObject<
//   {
//     AND?: ZodArray<ZodLazy<PrismaWhereLevel0<T>>>;
//     OR?: ZodArray<ZodLazy<PrismaWhereLevel0<T>>>;
//     NOT?: ZodArray<ZodLazy<PrismaWhereLevel0<T>>>;
//   } & {
//     [K in keyof T]?: PrismaFilterOperators<T[K]>;
//   },
//   'strip',
//   ZodTypeAny
// >;

// // Level 2: Includes AND, OR, NOT of Level 1
// type PrismaWhereLevel2<T extends zod.ZodRawShape> = ZodObject<
//   {
//     AND?: ZodArray<ZodLazy<PrismaWhereLevel1<T>>>;
//     OR?: ZodArray<ZodLazy<PrismaWhereLevel1<T>>>;
//     NOT?: ZodArray<ZodLazy<PrismaWhereLevel1<T>>>;
//   } & {
//     [K in keyof T]?: PrismaFilterOperators<T[K]>;
//   },
//   'strip',
//   ZodTypeAny
// >;

// // Level 3: Includes AND, OR, NOT of Level 2
// type PrismaWhereLevel3<T extends zod.ZodRawShape> = ZodObject<
//   {
//     AND?: ZodArray<ZodLazy<PrismaWhereLevel2<T>>>;
//     OR?: ZodArray<ZodLazy<PrismaWhereLevel2<T>>>;
//     NOT?: ZodArray<ZodLazy<PrismaWhereLevel2<T>>>;
//   } & {
//     [K in keyof T]?: PrismaFilterOperators<T[K]>;
//   },
//   'strip',
//   ZodTypeAny
// >;

// // Level 4: Includes AND, OR, NOT of Level 3
// type PrismaWhereLevel4<T extends zod.ZodRawShape> = ZodObject<
//   {
//     AND?: ZodArray<ZodLazy<PrismaWhereLevel3<T>>>;
//     OR?: ZodArray<ZodLazy<PrismaWhereLevel3<T>>>;
//     NOT?: ZodArray<ZodLazy<PrismaWhereLevel3<T>>>;
//   } & {
//     [K in keyof T]?: PrismaFilterOperators<T[K]>;
//   },
//   'strip',
//   ZodTypeAny
// >;

// Function to create a recursive schema up to level 4
export const createPrismaWhereSchema = <T extends zod.ZodRawShape>(
  modelSchema: zod.ZodObject<T>,
  depth: number = 3,
): zod.ZodObject<any> => {
  const fields = modelSchema.shape;

  /**
   * For each field, accept either:
   *   - a full operator object: { equals, in, lt, ... }
   *   - OR a raw value shorthand: 'foo'  -> { equals: 'foo' }
   */
  const makeFieldFilter = (value: zod.ZodTypeAny) => {
    const opsSchema = zod
      .object({
        equals: value.optional(),
        not: value.optional(),
        in: zod.array(value).optional(),
        notIn: zod.array(value).optional(),
        lt: value.optional(),
        lte: value.optional(),
        gt: value.optional(),
        gte: value.optional(),
        contains: zod.string().optional(),
        startsWith: zod.string().optional(),
        endsWith: zod.string().optional(),
        mode: zod.string().optional(),
      })
      .partial();

    return zod
      .preprocess((input) => {
        // let undefined through
        if (input === undefined) return input;

        // Already an object (likely { equals, in, ... }) → validate as-is
        if (
          typeof input === "object" &&
          input !== null &&
          !Array.isArray(input)
        ) {
          return input;
        }

        // Prisma-style shorthand: profileId: 'abc'  -> { equals: 'abc' }
        return { equals: input };
      }, opsSchema)
      .optional();
  };

  const fieldFilters = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, makeFieldFilter(value)]),
  );

  if (depth <= 0) {
    // Base case: no AND/OR/NOT
    return zod.object({
      ...fieldFilters,
    });
  }

  return zod.object({
    AND: zod
      .array(zod.lazy(() => createPrismaWhereSchema(modelSchema, depth - 1)))
      .optional(),
    OR: zod
      .array(zod.lazy(() => createPrismaWhereSchema(modelSchema, depth - 1)))
      .optional(),
    NOT: zod
      .array(zod.lazy(() => createPrismaWhereSchema(modelSchema, depth - 1)))
      .optional(),
    ...fieldFilters,
  });
};

export const getQueryOutput = <T extends zod.ZodTypeAny>(data: T) => {
  return z.object({
    status: z.number(),
    data: data.optional(),
    error: z.string().optional(),
  });
};

export const getQueryInput = <S extends zod.ZodTypeAny>(
  schema: S,
  options: { partialData?: boolean } = {},
) => {
  const { partialData = true } = options;

  // Only object schemas get "where" support.
  const isObjectSchema = schema instanceof zod.ZodObject;

  const whereSchema = isObjectSchema
    ? createPrismaWhereSchema(schema as any) // keep your existing recursive builder
    : zod.never(); // not used; also prevents people from sending "where" for arrays

  const dataSchema = isObjectSchema
    ? partialData
      ? (schema as any).partial().optional()
      : (schema as any).optional()
    : schema.optional(); // arrays: allow full array

  const querySchema = zod
    .object({
      data: dataSchema,

      // keep your query envelope fields
      skip: zod.number().default(0).optional(),
      limit: zod.number().default(10).optional(),
      cursor: zod.record(zod.any()).optional(),

      // only valid for object schemas
      where: isObjectSchema
        ? whereSchema.optional()
        : zod.undefined().optional(),

      orderBy: zod.record(zod.enum(["asc", "desc"])).optional(),
      include: zod.record(zod.boolean()).optional(),
      select: zod.record(zod.boolean()).optional(),
    })
    .partial();

  return zod.union([querySchema, zod.undefined()]);
};

export type inferQuery<T extends zod.ZodRawShape> = zod.infer<
  ReturnType<typeof createPrismaWhereSchema<T>>
>;

export type GetInferenceHelpers<
  TType extends "input" | "output",
  TRoot extends AnyTRPCClientTypes,
  TRecord extends TRPCRouterRecord,
> = {
  [TKey in keyof TRecord]: TRecord[TKey] extends infer $Value
    ? $Value extends TRPCRouterRecord
      ? GetInferenceHelpers<TType, TRoot, $Value>
      : $Value extends AnyProcedure
        ? inferProcedureOutput<$Value> // inferTransformedProcedureOutput<TRoot, $Value>
        : never
    : never;
};

export type inferRouterOutputs<TRouter extends AnyRouter> = GetInferenceHelpers<
  "output",
  TRouter["_def"]["_config"]["$types"],
  TRouter["_def"]["record"]
>;

// type SpecificOutput = Router['_def']['record']['createInterfaceDraft']['_def']['$types']['output'];
// type TestOutput = RouterOutput['createInterfaceDraft'];
