# Components

How each component folder is organized in the docs Storybook, and why. `a-singleline` is the example in this file.

## The approach

- **One Summary page with everything.** Each component has a Summary page with every section. It starts with Overview, the context of the component in plain text, then the sections that show every variant together (Variations, Attributes, States, HTML Structure, Accessibility), then one block per variant with the sections that change per variant (Skeleton for Default, then for Inline). The sections are in the same place in every component.
- **A Common page and one page per variant.** When a component has variants, the Summary page is split into smaller pages. The Common page has the sections that are the same for every variant: Variations, Attributes, HTML Structure and Accessibility. Each variant has its own page, with States for that variant only, then the sections that change per variant. A reader who only needs the Inline variant does not see notes about the Default variant.
- **The same order everywhere.** After Overview, the first part of the Summary page has the sections of the Common page, in the same order, with States after Attributes. Its variant blocks follow the variant pages: Default, then Inline. States is the exception: the Summary page shows it once, with both variants, the Common page does not show it, and each variant page shows it with only its variant.
- **Each text is written once, in plain Markdown.** The text of each section lives in its own `.md` file, in `content/`. The pages hold only the layout (header, sections, canvases and controls) and show the text in its place. A text can change without touching the layout, and every page that shows it changes too.
- **Stories at the end.** The Playground stories, one per variant, sit in their own group after the doc pages. They are kept apart from the doc pages because a doc page and a story with the same name (for example, "Default") cannot be in the same group in Storybook.

## Page layout

Each section has its title on top, across the whole width. Below the title:

- **Body**, on the left: the canvases and the controls.
- **Notes**, on the right: the section description, then the notes.

A full-width section has no notes column and no description. Its body uses the whole width. Overview, HTML Structure and Accessibility are full-width sections: the body of Overview is plain text, the body of HTML Structure is the code canvas, and the body of Accessibility is the note table. Overview is only on the Summary page.

On the Summary page, the Variations and States sections show every variant in one cells canvas (`docs-cells` page block): one cell per variant and state, each with its name at the top left, and lines between all the cells. Variations has one row ("Default"). States has one row per state ("Default · Error"), and each variant page shows it with one column. Active is a control of States that focuses every cell. One Controls block under the canvas changes every cell. In Variations, it has only State, which shows every cell in one of the states of States. Attributes, right under Variations, has its own cells canvas with the same row, and its Controls block has the attributes (Value, Placeholder, Text alignment, Width, Max length). The Controls blocks show Name, Default and Control: the notes describe each control, so `docs.css` hides the Description column, and the Default column shows the `table.defaultValue` of each argType, set only where the component has a known default. In States, the fields are static: no mouse and no `Tab`, so a real focus never mixes with the Active control. The Common page does the same in Variations and Attributes. TThe HTML Structure section shows the code in a code canvas (`docs-code` page block): one tab for the HTML and one for the CSS, with line numbers, an Expand button and a Copy button. The canvas keeps the height of the longest code, up to a limit, so it does not change size between the tabs. Expand raises the limit.

The page has 16px of padding. The docs header has 32px of padding, and each section has 32px of padding on every side, so their content lines up. The sections touch, with no space and no line between them, so two sections are 64px apart. The body and the notes have 48px between them. In the notes, a paragraph has no margin: 8px under each subtitle and between two paragraphs, and 40px above each subtitle. Section titles are 24px, smaller than the page title (32px). A line goes from the end of each section title to the right edge, centered on the text, and fades into the color of the page.

On the Summary page, a section of one variant shows a short variant label above its title (for example, "Default" above "Skeleton"). The label is part of the title, so each title has its own text and its own id. The pages of each variant do not need the label.

Below 1024px wide, the notes go under the body.

## Folder structure

```text
components/
└ atoms/
   └ a-singleline/
      ├ a-singleline.css                     the component
      ├ a-singleline.stories.ts              the stories
      ├ a-singleline.mdx                     Summary page
      ├ a-singleline-common.mdx              Common page
      ├ a-singleline-default.mdx             Default page
      ├ a-singleline-inline.mdx              Inline page
      ├ content/                             the texts, plain Markdown
      │  ├ overview.md
      │  ├ variations.md
      │  ├ attributes.md
      │  ├ states.md
      │  ├ accessibility.md
      │  ├ skeleton-default.md
      │  └ skeleton-inline.md
      └ sections/                            parts of a page that need code
         ├ html.mdx                          the code canvas of HTML Structure
         └ skeleton.json                     the Skeleton data, from the Figma export
```

## Sidebar

```text
Atoms
└ Singleline
   ├ Summary          a-singleline.mdx
   ├ Common        a-singleline-common.mdx
   ├ Default       a-singleline-default.mdx
   ├ Inline        a-singleline-inline.mdx
   └ Playground    a-singleline.stories.ts
      ├ Default
      └ Inline
```

The order (Summary first, Playground last, the other doc pages in alphabetical order between them) is set by `storySort` in `.storybook-ds/preview.ts`, for every component.

## What each file is

| File                             | What it has                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<token>.css`                    | The CSS of the component. The file name is the token, so the future move to `UI/src/css/` is a one-to-one swap.                                               |
| `<token>.stories.ts`             | The stories. The Playground stories (one per variant) show in the sidebar. The stories that only the doc pages show (Variations, States) have the `!dev` tag. |
| `<token>.mdx`                    | The Summary page: the sections that show every variant together, then one block per variant.                                                                  |
| `<token>-common.mdx`             | The Common page: the header and the sections that show every variant together. Only for components with variants.                                             |
| `<token>-<variant>.mdx`          | The page of one variant: the header, States with only this variant, and the sections that change per variant. Only for components with variants.              |
| `content/<section>.md`           | The text of one section: its description, then its notes. For Accessibility, only the note table.                                                             |
| `content/<section>-<variant>.md` | The text of one section for one variant, when the text changes per variant.                                                                                   |
| `sections/html.mdx`              | The code canvas of HTML Structure. It reads the HTML from the stories and the CSS from the component file, so it needs MDX.                                   |
| `sections/skeleton.json`         | The Skeleton data, written by the Skeleton export from Figma. Never edited by hand.                                                                           |

A component without variants has only `<token>.mdx`, with no Common page and no variant pages.

## Content files

A content file holds the text of one section, in plain Markdown, with no imports and no components. Storybook only reads `.mdx` files as pages, so a `.md` file never shows in the sidebar.

```md
The component has four states: inactive, active, error and read only.

### Inactive

The field is ready to receive input.
```

- The first paragraph is the section description: the first paragraph of the notes column. No title before it.
- The rest of the file is the notes of the section. Subtitles use `###`. The page holds the `#` and `##` titles.
- In `states.md`, each state has its own `###` title, with the state name of the component (`### Inactive`), and the file has no other `###` title. The Skeleton export checks the states of its canvases against these titles.
- `overview.md` has no description, only text: the context of the component. Only the Summary page shows it.
- `accessibility.md` has no description, only the note table, in HTML. Markdown blocks do not work inside a table cell, so each paragraph is in `<p>` and each reference is in `<li>`. Links and `code` in Markdown work inside them. HTML attributes use `class`, not `className`.
- A comment goes only where an edit could break something, for example above the list of states: `<!-- ... -->`. It does not show on the page.
- If a text ever needs a live example in the middle, the page shows it between two `.md` files.

A page imports the file as text (`?raw`) and shows it with the `Markdown` block of Storybook. The block is the column itself: `className` gives it the class of the column, and `forceWrapper` keeps the column when the text has only one paragraph. Each section starts with a comment on one line with its title, so the start of each section is easy to find. The title comes first, then the body, then the notes:

```mdx
import { Meta, Canvas, Controls, Markdown } from '@storybook/addon-docs/blocks';
import states from './content/states.md?raw';

{/* Section: States */}

<div className="docs-section">

## States

<div className="docs-section-body">

<Canvas of={Stories.StatesDefault} sourceState="none" />

</div>
<Markdown className="docs-section-notes" options={{ forceWrapper: true }}>
    {states}
</Markdown>
</div>
```

A full-width section adds the `docs-section--full` class and has no notes column. On the Summary page, the title of a section of one variant starts with the variant label, and so does its comment:

```mdx
{/* Section: Default Skeleton */}

<div className="docs-section">

## <span className="docs-section-variant">Default</span> Skeleton
```

## Editing the docs

- **To change a text,** edit its file in `content/`. The pages that show it change too.
- **To change the layout of a page** (the order of the sections, canvases, controls), edit the page (`<token>.mdx`, `<token>-common.mdx` or `<token>-<variant>.mdx`). Keep the first part of the Summary page in the same order as the Common page, and its variant blocks in the same order as the variant pages.
- **The text in the header** of each page (the short description under the title) is written in the page itself, as a string expression: `{'...'}`. Plain text on its own lines inside a JSX element becomes a Markdown paragraph in MDX, so the description would get a second `<p>` inside it, with the margin of Storybook.

## Known limits

- When one page shows two content files with the same subtitles, the subtitles get the same `id`, because the `id` comes from the text of the subtitle. The anchor link of the second one goes to the first one.
- On the Summary page, the Skeleton notes of Default and Inline have the same subtitles (Dimensions and spacing, Error icon, Responsive behavior), so they get the same `id`.
- The Skeleton sections show their title and their notes for now. The body is empty until the Skeleton canvas is ready.
