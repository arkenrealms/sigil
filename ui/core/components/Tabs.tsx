// sigil/ui/core/components/Tabs.tsx
import { createContext, h, cloneElement } from "preact";
import { useContext, useMemo, useState } from "preact/hooks";
import type { ComponentChildren, VNode } from "preact";

type TabsCtx = {
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
};

const TabsContext = createContext<TabsCtx>(null as any);

function chain<A extends any[]>(
  a?: (...args: A) => void,
  b?: (...args: A) => void
) {
  if (!a && !b) return undefined;
  return (...args: A) => {
    a?.(...args);
    b?.(...args);
  };
}

function mergeClass(a?: string, b?: string) {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

export type TabsGroupProps = {
  /** Controlled */
  index?: number;
  /** Uncontrolled default */
  defaultIndex?: number;
  onChange?: (index: number) => void;
  class?: string;
  style?: any;
  children?: ComponentChildren;
};

export type TabsListProps = {
  class?: string;
  style?: any;
  children?: ComponentChildren;
};

export type TabProps = {
  name: string;
  index: number;

  /** Optional passthrough */
  class?: string | ((args: { selected: boolean }) => string);
  style?: any;

  children?:
    | ComponentChildren
    | ((args: { selected: boolean }) => ComponentChildren);

  /** Optional user handlers that should still run */
  onPointerDown?: (e: any) => void;
  onClick?: (e: any) => void;
};

export type TabsPanelsProps = {
  class?: string;
  style?: any;
  children?: ComponentChildren;
};

export type TabsPanelProps = {
  class?: string;
  style?: any;
  children?: ComponentChildren;
};

export const Tab = (props: TabProps) => {
  const ctx = useContext(TabsContext);
  const selected = ctx.selectedIndex === props.index;

  const className =
    typeof props.class === "function" ? props.class({ selected }) : props.class;

  const handleClick = (e: any) => {
    props.onClick?.(e);
    ctx.setSelectedIndex(props.index);
  };

  const handlePointerDown = (e: any) => {
    props.onPointerDown?.(e);
  };

  const rendered =
    typeof props.children === "function"
      ? (props.children as any)({ selected })
      : props.children;

  /**
   * Preferred path:
   * - children returns a single VNode (your TabButton)
   * - we CLONE it and only inject handlers / className merge
   * - IMPORTANT: we DO NOT override style unless props.style is provided
   *   (to avoid breaking sizing / text height in UITK)
   */
  if (rendered && typeof rendered === "object" && (rendered as VNode).type) {
    const vnode = rendered as VNode<any>;

    const nextProps: any = {
      onClick: chain(vnode.props?.onClick, handleClick),
      onPointerDown: chain(vnode.props?.onPointerDown, handlePointerDown),
    };

    // Only merge class if caller provided one; don't stomp child's class.
    if (className) {
      nextProps.class = mergeClass(vnode.props?.class, className);
    }

    // Only set style if caller explicitly provided it.
    if (typeof props.style !== "undefined") {
      nextProps.style = props.style;
    }

    return cloneElement(vnode, nextProps);
  }

  /**
   * Fallback:
   * - If rendered is text/fragment/array, we must wrap.
   * - This can affect layout, so try to keep Tab children as a single root node.
   */
  return (
    <div
      class={className}
      style={props.style}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    >
      {rendered as any}
    </div>
  );
};

Tab.Group = (props: TabsGroupProps) => {
  const isControlled = typeof props.index === "number";
  const [internal, setInternal] = useState<number>(props.defaultIndex ?? 0);

  const selectedIndex = isControlled ? (props.index as number) : internal;

  const setSelectedIndex = (i: number) => {
    if (!isControlled) setInternal(i);
    props.onChange?.(i);
  };

  const value = useMemo<TabsCtx>(
    () => ({ selectedIndex, setSelectedIndex }),
    [selectedIndex]
  );

  return (
    <TabsContext.Provider value={value}>
      <div class={props.class} style={props.style}>
        {props.children}
      </div>
    </TabsContext.Provider>
  );
};

Tab.List = (props: TabsListProps) => (
  <div class={props.class} style={props.style}>
    {props.children}
  </div>
);

Tab.Panels = (props: TabsPanelsProps) => {
  const ctx = useContext(TabsContext);
  const arr = Array.isArray(props.children) ? props.children : [props.children];

  return (
    <div class={props.class} style={props.style}>
      {arr[ctx.selectedIndex]}
    </div>
  );
};

Tab.Panel = (props: TabsPanelProps) => (
  <div class={props.class} style={props.style}>
    {props.children}
  </div>
);
