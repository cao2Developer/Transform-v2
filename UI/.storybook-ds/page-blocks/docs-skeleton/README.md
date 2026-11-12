# docs-skeleton

The Skeleton canvas of the doc pages of the docs Storybook. It is a documentation component (a page block), not a design system component: no product screen uses it. It draws the skeleton of a component (parts, spacing, sizes and tokens) from the Skeleton export of Figma.

- **What it is:** a custom element, `<docs-skeleton>`, in TypeScript. No library.
- **Files:** `docs-skeleton.ts` (the element) and `docs-skeleton.css` (the styles), in this folder. `UI/.storybook-ds/preview.ts` imports both, after `docs-switch.css`, so the element is defined before a doc page renders. The px and rem and 2x switches are `docs-switch`, and the title of each canvas is a canvas info (`docs-canvas-info`).
- **Data:** `sections/skeleton.json` in the folder of each component, written by the Skeleton export (`figma-export/`, see its README). Never by hand.
- **Tokens:** base tokens only, like the other page blocks. Values with no base token are custom properties at the top of `docs-skeleton.css`, each with a comment.

## Use in MDX

One element per variant, in the body of the Skeleton section of that variant:

```mdx
import skeleton from './sections/skeleton.json';

<div className="docs-section-body">
    <docs-skeleton
        data={skeleton.variants.find((v) => v.variant === 'Default')}
    />
</div>
```

Find the variant by its name, never by its index: the order of `variants` is the order of the canvases in the export. React passes `data` as a property, with no wrapper, because the element is already defined when the page renders.

## Data

`data` is one variant of the export:

```ts
const data: SkeletonData = {
    variant: 'Default', // null for a component with no variants
    dir: 'ltr', // or 'rtl'
    groups: [
        {
            canvas: '4035:21241', // the canvas in Figma
            states: ['Inactive', 'Active', 'Read only'],
            layouts: [], // one Layout per state, in the order of states
        },
    ],
};
```

A `Layout` has the size of the component (`width`, `height`), its `parts` (the box and each element), its `marks` (each space and each size) and its `rows` (each measure with its value and token). The types are at the top of `docs-skeleton.ts`. All values are px.

## API

- **`data`** (property): one variant of the export. It sets `label` and `dir` when the page did not set them.
- **`label`** (attribute): the variant, first in the title of each canvas. Default: the variant of `data`.
- **`dir`** (attribute): `ltr` or `rtl`. Default: the dir of `data`. The drawing uses logical positions, so `rtl` flips it. Only `ltr` is checked.
- **`groups`** (property, read only): what the element draws.
- **`refresh()`**: draws again.
- **`highlight(key)`**: shows one part or mark, by its key. `null` clears it.
- **Events:** `docs-skeleton-measured` after each drawing, and `docs-skeleton-highlight` on each highlight, with the key in `detail`.

`groups`, `highlight(key)` and the two events have no use on the page now. They stay for a token table (see "Token table").

## What it shows

- One canvas per group of states. The title is a canvas info (`docs-canvas-info`, Documentation / Canvas Info in Figma), as the cells of `docs-cells`: the variant in medium and the states in regular, in lowercase, for example `default · inactive, active, read only`.
- The rulers, the faint guides of each edge (dashed), the parts (visible, hidden, dead space), the spaces in the color of their token, and the sizes that the export marks.
- Hover on a part shows its name, its guides and its range on the rulers. Hover on a space shows the numbers of every space of the same size.
- The legend lists the element types and the tokens of the canvas, with their values. Hover on a token lights its spaces. A click pins it. A second click, a click elsewhere or Escape releases it.
- The 2x and rem switches change every canvas of the page together. 2x doubles the drawing only: every value stays the real one.
- With no `data`, or no groups (for example, a variant name that is not in the export), the element shows one line: "No skeleton data".
- The element draws again when its width changes, because the legend can wrap.

## Accessibility

- The drawing is `aria-hidden`. The legend is the accessible content: two lists, the element types and the tokens with their values (`space-lg 16`). With the title of each canvas and the notes of the section, it is the text of the canvas.
- The switches are `docs-switch`: native checkboxes with `role="switch"`, with the keyboard.
- The hover and the pin of the legend are for the pointer only.

## Token table

The canvases have no token table. A token table under each canvas would list every measure of each state, with its property, value and token, and show a difference only in the border (for example, Read only). The rows are already in the data (`rows` of each `Layout`).

To bring one back:

1. A second page block reads `groups` of the element, and uses `highlight(key)` and the two events for the hover in both directions.
2. It loads after `docs-table.css` in `preview.ts`, and its element goes after each canvas.
3. The legend of each canvas becomes `aria-hidden` again, because the table is the accessible content.

## Points to review

- **RTL:** the drawing uses logical positions, but `rtl` is not checked yet. In Figma, the canvas info hides the dir (`show dir` off) until the docs Storybook has a global ltr and rtl setting.
- **Border:** a difference only in the border width (a hidden box in Figma, for example Read only) is in the rows of the data, not on the page. The notes of the section say it.
- **Subcomponents:** the export does not mark subcomponents yet, so the canvas does not draw them (no numbers, no legend of subcomponents).
