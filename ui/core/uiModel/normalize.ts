// sigil/ui/core/uiModel/normalize.ts

export type MenuJSON = {
  id: string;
  title?: string;
  items: Array<{
    id: string;
    label: string;
    icon: string;
    action:
      | { type: "modal"; key: string }
      | { type: "emit"; event: string; payload?: any };
  }>;
  responsive?: {
    mobile?: { mode: "drawer"; handleIcon: string };
    desktop?: { mode: "inline" };
  };
};

export type MenuModel = {
  id: string;
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon: string;
    action:
      | { type: "modal"; key: string }
      | { type: "emit"; event: string; payload?: any };
  }>;
  responsive: {
    mobile: { mode: "drawer"; handleIcon: string };
    desktop: { mode: "inline" };
  };
};

export function normalizeMenu(json: MenuJSON): MenuModel {
  const title = json.title || "";
  const responsive = {
    mobile: json.responsive?.mobile || {
      mode: "drawer" as const,
      handleIcon: "/evolution/images/arrow_left.png",
    },
    desktop: json.responsive?.desktop || { mode: "inline" as const },
  };

  const items = (json.items || []).map((it) => ({
    id: it.id,
    label: it.label || it.id,
    icon: it.icon || "",
    action: it.action,
  }));

  return {
    id: json.id,
    title,
    items,
    responsive,
  };
}
