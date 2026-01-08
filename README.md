# Arken Sigil

Game UI built for the Arken Realms, using OneJS in Unity.

<img width="378" height="759" alt="image" src="https://github.com/user-attachments/assets/78e510c8-7cd0-4fa0-8a46-acdc0871a3aa" />


## Setup

* `npm run setup` to install all dev dependencies
* `ctrl` + `shift` + `b` to start up all the watchers in VSCode

## Getting Started

You'll need the .cs files in the `deps` folder for custom functionality to work.

### Prompting

AI is amazing. But it needs some help.

```
You are converting a React + styled-components UI to OneJS running in Unity UI Toolkit (USS).

IMPORTANT CONSTRAINTS — DO NOT VIOLATE:

- This is NOT web CSS. Reference Unity UI Toolkit (USS) rules, not browser CSS.
- DO NOT invent or assume CSS support.

STYLING (USS) RULES:
- USS does NOT support: outline, box-shadow, text-shadow, user-select.
- USS does NOT support `background`; use `background-color` only.
- USS does NOT support `z-index`; visual stacking depends on element order.
- USS ignores inline `style` if a `class` attribute is present — never use both.
- USS filters are limited to:
  blur(<length>) | grayscale(<number>) | invert(<number>) | opacity(<number>)
  | sepia(<number>) | tint(<color>) | hue-rotate(<angle>) | contrast(<number>)
  (`none` is NOT a valid filter value)

LAYOUT & RENDERING:
- Unity UI Toolkit rendering can fail hard if JSX throws during construction, or if using invalid USS (eg. `filter: none`)
- Rendering stops silently if a runtime error occurs mid-tree.
- Order of JSX children matters for visibility and stacking.
- Avoid CSS Grid and `gap`; prefer flexbox with explicit margins.

JSX / PREACT RULES:
- OneJS does NOT provide Fragment automatically.
- JSX fragments (`<>...</>`) require:
  `import { Fragment } from "preact"`

STYLED SYSTEM RULES:
- Styled-components inheritance is unreliable in OneJS.
- DO NOT extend styled components via `styled(OtherComponent)`.
- Use shared variables, helper functions, or duplicated styles instead.

EVENTS:
- Unity PointerEvents use `StopPropagation()` (capital S), not `stopPropagation`.
- Pointer events may fire even after drag unless explicitly suppressed.

DEBUGGING RULE:
- If UI partially renders, assume a JSX runtime error AFTER the last visible node.
- Never assume layout issues — verify runtime safety first.

WHEN IN DOUBT:
- Check documentation before using an unknown CSS property, and let me know which ones you are removing.
- Prefer explicit layout and ordering over abstraction.
```

## Components

### ui.actions.ActionSlot

<img width="53" height="54" alt="image" src="https://github.com/user-attachments/assets/cb1dff1b-52ef-4296-a493-b300e8eb98cf" />
<img width="52" height="56" alt="image" src="https://github.com/user-attachments/assets/53334071-62f6-4b4b-b255-fe5683965c71" />

### ui.actions.ActionBar

<img width="209" height="56" alt="image" src="https://github.com/user-attachments/assets/a66b7468-9ae7-4f5c-9585-8535d96fad3a" />

### ui.actions.ActionGrid

<img width="278" height="278" alt="image" src="https://github.com/user-attachments/assets/473e29c8-b5ac-41c9-b00d-dd19ba70575b" />

### ui.actions.ActionBarSwiper

<img width="221" height="72" alt="image" src="https://github.com/user-attachments/assets/18194df0-c497-4713-b35c-dca632f2ebbb" />

### ui.actions.ActionHub

Collapsed:

<img width="678" height="140" alt="image" src="https://github.com/user-attachments/assets/4f1dfbca-2988-4a59-8b7d-0ee7b635d1aa" />

Expanded:

<img width="674" height="282" alt="image" src="https://github.com/user-attachments/assets/65bd35e4-b606-41af-9999-e5e06228b64e" />

### ui.game.SideDock

<img width="580" height="394" alt="image" src="https://github.com/user-attachments/assets/5107dc36-6985-4a0a-a469-3c08c4378766" />

### ui.game.Hud


### ui.core.Popup

<img width="670" height="284" alt="image" src="https://github.com/user-attachments/assets/a6fcce4c-2838-434a-a192-fd99c96b0f06" />

### ui.core.Text

<img width="117" height="58" alt="image" src="https://github.com/user-attachments/assets/fd7f7f98-ec61-4ac4-bdae-bec095a84c0c" />

### ui.core.Icon

<img width="49" height="50" alt="image" src="https://github.com/user-attachments/assets/35dc307b-1909-42a7-9ea0-1cd55af37b15" />

### ui.core.Slider

<img width="274" height="38" alt="image" src="https://github.com/user-attachments/assets/13d56e74-3bbc-4ad9-997d-cecdcc920559" />


### Debugging

The most obtuse one that kept coming up is this error, which seems to be when unity finds an attribute like `filter` but fails to find the option, ie. if it has `filter: opacity(1)` which finds `opacity` but can't find `none` for `filter: none` . Their internal rendering must be so complex that in some situations it even silently fails to continue rendering.

`ArgumentOutOfRangeException: Index was out of range. Must be non-negative and less than the size of the collection.`


### Networking

**JS side**

* bind on server events: https://github.com/arkenrealms/sigil/blob/main/ui/game/views/InGame.tsx#L414-L419
* fire UI events: https://github.com/arkenrealms/sigil/blob/main/ui/game/views/InGame.tsx#L23-L30

**C# side**

* handle server events: https://github.com/arkenrealms/sigil/blob/main/deps/Bridge.cs.txt#L54-L56
* handle UI events: https://github.com/arkenrealms/sigil/blob/main/deps/Bridge.cs.txt#L62-L113