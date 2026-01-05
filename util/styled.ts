// sigil/util/styled.ts
import _styled from "preact/styled";
import type { ComponentType } from "preact";

/**
 * OneJS / onejs-preact sometimes returns components with a signature like:
 *   (props, ref) => Element
 * or other extra args.
 *
 * So we must treat "component" as callable with (props, ...rest).
 */
type AnyCallableComp<P = any> = (props: P, ...rest: any[]) => any;

// Also allow normal Preact component types
type AnyComp<P = any> = ComponentType<P> | AnyCallableComp<P>;

/** Extract props from either ComponentType<P> or (props:P,...rest)=>any */
type PropsOf<C> = C extends (props: infer P, ...rest: any[]) => any
  ? P
  : C extends ComponentType<infer P>
  ? P
  : any;

type IntrinsicProps<K extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[K];

type StyledComponent<P> = ComponentType<P>;

/**
 * Tag builder: styled.div<P>`...` -> component that takes (div props + P)
 */
type StyledTags = {
  [K in keyof JSX.IntrinsicElements]: <P = {}>(
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<IntrinsicProps<K> & P>;
};

/**
 * Component builder: styled(Component)`...` -> component that takes Component props (+ extra)
 *
 * NOTE: We don't force generics here; we infer props from the input component.
 */
type StyledWrap = {
  <C extends AnyComp<any>, PExtra = {}>(component: C): (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<PropsOf<C> & PExtra>;

  /** callable form: styled("div")`...` */
  <K extends keyof JSX.IntrinsicElements, PExtra = {}>(tag: K): (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<IntrinsicProps<K> & PExtra>;

  /**
   * Very loose overload for custom tags like "cooldownradial"
   * (unless you augment JSX.IntrinsicElements)
   */
  <PExtra = {}>(tag: string): (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<PExtra & Record<string, any>>;
};

type Styled = StyledWrap & StyledTags;

// Runtime is still OneJS's styled; we only improve types.
const styled = _styled as unknown as Styled;
export default styled;
