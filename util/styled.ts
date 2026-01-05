// sigil/util/styled.ts
//
import _styled from "preact/styled";
import type { ComponentType } from "preact";

// A Preact component that returns any VNode-ish thing.
// Using ComponentType keeps it compatible with function/class components.
type AnyComp<P = any> = ComponentType<P>;

// Helper: get props for intrinsic tag
type IntrinsicProps<K extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[K];

// The *result* of styled(tag)`...` or styled(Component)`...` is a component.
type StyledComponent<P> = ComponentType<P>;

/**
 * Tag builder: styled.div<P>`...` -> component that takes (div props + P)
 */
type StyledTag = {
  <P = {}>(strings: TemplateStringsArray, ...values: any[]): StyledComponent<
    JSX.IntrinsicElements["div"] & P
  >;
};

type StyledTags = {
  [K in keyof JSX.IntrinsicElements]: <P = {}>(
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<IntrinsicProps<K> & P>;
};

/**
 * Component builder: styled(Label)`...` -> component that takes Label's props (plus optional P)
 */
type StyledWrap = {
  <PBase, PExtra = {}>(component: AnyComp<PBase>): (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<PBase & PExtra>;

  // Also allow wrapping intrinsic tag via callable form: styled("div")`...`
  <K extends keyof JSX.IntrinsicElements, PExtra = {}>(tag: K): (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<IntrinsicProps<K> & PExtra>;

  // And a very loose overload for custom elements like "cooldownradial"
  // (since it's not in JSX.IntrinsicElements unless you augment it).
  <PExtra = {}>(tag: string): (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => StyledComponent<PExtra & Record<string, any>>;
};

type Styled = StyledWrap & StyledTags & { div: StyledTag };

// Runtime is still OneJS's styled; we only improve types.
const styled = _styled as unknown as Styled;
export default styled;
