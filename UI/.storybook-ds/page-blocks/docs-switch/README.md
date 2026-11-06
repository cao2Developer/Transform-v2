# docs-switch

A switch for the doc pages of the docs Storybook. It is a documentation component, not a design system component: it is part of the page around the components, and no product screen uses it. The first use is the px and rem switch of the Skeleton canvas.

- **What it is:** a native checkbox with `role="switch"`, styled with plain CSS. No JavaScript, no library.
- **File:** `docs-switch.css`, in this folder. Import it in `UI/.storybook-ds/preview.ts`, after `docs-table.css`.
- **Tokens:** base tokens only. Values with no base token are custom properties at the top of the file, each with a comment.

## Markup

```html
<!-- with a label: the whole row is clickable -->
<label class="docs-switch-row">
    <input
        class="docs-switch"
        type="checkbox"
        role="switch"
        data-size="compact"
    />
    <span>rem</span>
</label>

<!-- alone: it needs its own name -->
<input
    class="docs-switch"
    type="checkbox"
    role="switch"
    aria-label="Notifications"
/>
```

The thumb is not in the markup. It is the `::before` of the input, so there is nothing to keep in sync.

| Class or attribute    | What it does                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `.docs-switch`        | The input. It draws the track and the thumb.                                                                  |
| `.docs-switch-row`    | The optional label around it. It makes the whole row clickable, and its text follows the state of the switch. |
| `data-size="compact"` | 28×16 with a 12px thumb. Without it, the switch is 34×20 with a 16px thumb.                                   |
| `checked`, `disabled` | The native attributes. Nothing else is needed.                                                                |

To react to a change, listen to the `change` event of the input. To set the state from code, set `input.checked`.

## Sizes

| Size    | Track | Thumb | Press growth |
| ------- | ----- | ----- | ------------ |
| Default | 34×20 | 16px  | 4px          |
| Compact | 28×16 | 12px  | 3px          |

The thumb is 2px from the edge of the track, in both sizes.

## States and motion

| State    | What the user sees                                                                                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Off      | Slate track (`--base-color-neutral-70`), white thumb on the start side. The label text is `--base-color-neutral-70` too.                                                                              |
| On       | Teal track (`--base-color-primary-teal-50`), thumb on the end side.                                                                                                                                   |
| Hover    | The track gets 10% darker when off and 8% darker when on. The thumb grows 2px. Only with a mouse (`hover: hover` and `pointer: fine`), so a tap on a touch screen does not leave the thumb stretched. |
| Press    | The thumb grows 4px (3px compact) and gets the same amount shorter. Press wins over hover.                                                                                                            |
| Change   | The thumb slides and the track changes color. The thumb uses a 160ms critical spring (no overshoot). The track and the label fade in 80ms.                                                            |
| Focus    | The `--shadow-active` shadow, on keyboard focus only (`:focus-visible`).                                                                                                                              |
| Disabled | Opacity 0.5, no pointer. With a label, the label carries the opacity, so it is not applied twice.                                                                                                     |

The hover styles are allowed here. The rule "no hover styles" is for design system components, not for documentation components.

**Reduced motion.** With `prefers-reduced-motion: reduce`, the thumb stops sliding and stops changing size. The color fades stay, because they do not move anything.

## Accessibility

- A native checkbox with `role="switch"` is announced as "switch, on" or "switch, off". The state is `checked`, so there is no `aria-checked` to keep in sync.
- Keyboard: Tab to focus, Space to toggle. Enter does not toggle, because it is a checkbox (the ARIA switch pattern lists Space as the required key).
- A switch with no visible text needs `aria-label`. With a `<label>`, the text is the name.
- Pattern: ARIA Authoring Practices, Switch: https://www.w3.org/WAI/ARIA/apg/patterns/switch/

## Contrast

Measured on white. Both states pass: the off track and its label (`--base-color-neutral-70`) are 5.37:1, the on track (`--base-color-primary-teal-50`) is 3.33:1, and the on label (`--base-color-neutral-80`) is 9.64:1. A control needs 3:1 (WCAG 2.2, 1.4.11) and text needs 4.5:1 (1.4.3). The white thumb is 5.37:1 on the off track and 3.33:1 on the on track.

## Points to review

- **Thumb drag.** A switch in a product usually lets the user drag the thumb. This one does not, because a unit switch does not need it. It can be added with a small script if a page block asks for it.
- **Enter.** It would need a small script, and no page block asks for it.

## Scope

The switch has hover, press and state change, and no thumb drag. It does not depend on any other class or script, so a page block can use it by importing the CSS file only.
