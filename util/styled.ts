// sigil/util/styled.ts
import _styled from "preact/styled";
import type { ComponentType } from "preact";

type AnyCallableComp<P = any> = (props: P, ...rest: any[]) => any;
type AnyComp<P = any> = ComponentType<P> | AnyCallableComp<P>;
type PropsOf<C> = C extends (props: infer P, ...rest: any[]) => any
  ? P
  : C extends ComponentType<infer P>
  ? P
  : any;

type IntrinsicProps<K extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[K];
type StyledComponent<P> = ComponentType<P>;

type StyledTags = {
  [K in keyof JSX.IntrinsicElements]: <P = {}>(
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<IntrinsicProps<K> & P>;
};

type StyledWrap = {
  <C extends AnyComp<any>, PExtra = {}>(component: C): (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<PropsOf<C> & PExtra>;

  <K extends keyof JSX.IntrinsicElements, PExtra = {}>(tag: K): (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<IntrinsicProps<K> & PExtra>;

  <PExtra = {}>(tag: string): (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<PExtra & Record<string, any>>;
};

type Styled = StyledWrap & StyledTags;

// -------- runtime guard --------

const raw = _styled as any;

/**
 * Creates a template tag function that throws with a clear message.
 * This prevents "silent UI death" when calling styled.img`...`.
 */
function unsupportedTag(tag: string) {
  return (_strings: TemplateStringsArray, ..._values: any[]) => {
    throw new Error(
      `[styled] Unsupported tag "${tag}". ` +
        `OneJS/UI Toolkit does not provide this intrinsic. ` +
        `Use a supported tag (div/span) or a real component (e.g. <Icon />), ` +
        `or use styled("Image") only if you have that intrinsic registered.`
    );
  };
}

/**
 * Proxy: if you access styled.img / styled.style etc and it's missing on runtime styled,
 * we throw immediately (instead of returning undefined and crashing later).
 */
const styled = new Proxy(raw, {
  get(target, prop) {
    const v = (target as any)[prop as any];

    // let normal properties/methods work
    if (v != null) return v;

    // If someone asks for a tag helper that doesn't exist, fail loudly.
    if (typeof prop === "string") return unsupportedTag(prop);

    return v;
  },
  apply(target, thisArg, argArray) {
    // styled(Component) / styled("div") still works
    return Reflect.apply(target as any, thisArg, argArray);
  },
}) as unknown as Styled;

export default styled;
