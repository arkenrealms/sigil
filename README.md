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

### ActionSlot

<img width="42" height="44" alt="image" src="https://github.com/user-attachments/assets/7c7d9958-5bc7-42f5-93b8-0941daa23e8d" /><img width="42" height="46" alt="image" src="https://github.com/user-attachments/assets/8c558db1-bd39-4b33-b6d7-119c17dbe521" />


### ActionBar

<img width="171" height="65" alt="image" src="https://github.com/user-attachments/assets/7b1cf68d-a725-4011-9e78-cc7b9dd7c0d9" />


### ActionGrid

<img width="216" height="222" alt="image" src="https://github.com/user-attachments/assets/0419cc4b-c939-4021-a8e7-63d15649b1a0" />


### ActionBarSwiper

<img width="171" height="65" alt="image" src="https://github.com/user-attachments/assets/7b1cf68d-a725-4011-9e78-cc7b9dd7c0d9" />


### Debugging

The most obtuse one that kept coming up is this error, which seems to be when unity finds an attribute like `filter` but fails to find the option, ie. if it has `filter: opacity(1)` which finds `opacity` but can't find `none` for `filter: none` . Their internal rendering must be so complex that in some situations it even silently fails to continue rendering.

`ArgumentOutOfRangeException: Index was out of range. Must be non-negative and less than the size of the collection.`
