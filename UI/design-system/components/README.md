# Components

How each component folder is organized in the docs Storybook, and why. `a-singleline` is the example in this file.

## The approach

- **One Docs page with everything.** Each component has a Docs page with every section. It starts with the sections that show every variant together (Variations, States, HTML Structure, Accessibility), then one block per variant with the sections that change per variant (Skeleton for Default, then for Inline). The sections are in the same place in every component.
- **A Common page and one page per variant.** When a component has variants, the Docs page is split into smaller pages. The Common page has the sections that are the same for every variant: Variations, HTML Structure and Accessibility. Each variant has its own page, with States for that variant only, then the sections that change per variant. A reader who only needs the Inline variant does not see notes about the Default variant.
- **The same order everywhere.** The first part of the Docs page has the sections of the Common page, in the same order, with States after Variations. Its variant blocks follow the variant pages: Default, then Inline. States is the exception: the Docs page shows it once, with both variants, the Common page does not show it, and each variant page shows it with only its variant.
- **Each text is written once.** The text of each section lives in its own file, in `sections/`. The pages hold only the structure (header, sections, canvases and controls) and import the text. When a text changes, every page that shows it changes too.
- **Stories at the end.** The Playground stories, one per variant, sit in their own group after the doc pages. They are kept apart from the doc pages because a doc page and a story with the same name (for example, "Default") cannot be in the same group in Storybook.

## Page layout

Each section has its title on top, across the whole width. Below the title:

- **Body**, on the left: the canvases and the controls.
- **Notes**, on the right: the section description, then the notes.

A full-width section has no notes column. Its body uses the whole width: the description, then the content. HTML Structure and Accessibility are full-width sections. Accessibility has no description: its body is the note table.

On the Docs page, the Variations and States sections show every variant side by side in one canvas, with no name and no line between them, and one Controls block under it that changes all of them (`docs-variants` page block). The Common page does the same in Variations. The HTML Structure section shows the code in a code canvas, with one tab for the HTML and one for the CSS, and a maximum height (`docs-code` page block).

The page has 16px of padding. The docs header and each section have 32px of padding on the sides, so their content lines up. The body and the notes have 48px between them. Between two sections: 48px, a line, then 48px. Section titles are 24px, smaller than the page title (32px).

On the Docs page, a section of one variant shows a short variant label above its title (for example, "Default" above "Skeleton"). The label is part of the title, so each title has its own text and its own id. The pages of each variant do not need the label.

Below 1024px wide, the notes go under the body.

## Folder structure

```text
components/
└ atoms/
   └ a-singleline/
      ├ a-singleline.css                     the component
      ├ a-singleline.stories.ts              the stories
      ├ a-singleline.mdx                     Docs page
      ├ a-singleline-common.mdx              Common page
      ├ a-singleline-default.mdx             Default page
      ├ a-singleline-inline.mdx              Inline page
      └ sections/
         ├ variations.mdx
         ├ html.mdx
         ├ accessibility.mdx
         ├ states.mdx
         ├ skeleton-default.mdx
         └ skeleton-inline.mdx
```

## Sidebar

```text
Atoms
└ Singleline
   ├ Docs          a-singleline.mdx
   ├ Common        a-singleline-common.mdx
   ├ Default       a-singleline-default.mdx
   ├ Inline        a-singleline-inline.mdx
   └ Playground    a-singleline.stories.ts
      ├ Default
      └ Inline
```

The order (Docs first, Playground last, the other doc pages in alphabetical order between them) is set by `storySort` in `.storybook-ds/preview.ts`, for every component.

## What each file is

| File                               | What it has                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<token>.css`                      | The CSS of the component. The file name is the token, so the future move to `UI/src/css/` is a one-to-one swap.                                                     |
| `<token>.stories.ts`               | The stories. The Playground stories (one per variant) show in the sidebar. The stories that only the doc pages show (Variations, States) have the `!dev` tag.       |
| `<token>.mdx`                      | The Docs page: the sections that show every variant together, then one block per variant.                                                                           |
| `<token>-common.mdx`               | The Common page: the header and the sections that show every variant together. Only for components with variants.                                                   |
| `<token>-<variant>.mdx`            | The page of one variant: the header, States with only this variant, and the sections that change per variant. Only for components with variants.                    |
| `sections/<section>.mdx`           | The description and notes of one section. For HTML Structure, the description and the content of the section. For Accessibility, only the content (the note table). |
| `sections/<section>-<variant>.mdx` | The description and notes of one section for one variant, when the text changes per variant.                                                                        |

A component without variants has only `<token>.mdx`, with no Common page and no variant pages.

## Section files

A section file holds the text of one section: its description, then its notes.

```mdx
import { Meta } from '@storybook/addon-docs/blocks';

<Meta isTemplate />

The component has four states: inactive, active, error and read only.

- **Inactive:** the field is ready to receive input.
- ...
```

- `<Meta isTemplate />` keeps the file out of the sidebar. Without it, Storybook shows every `.mdx` file as a page. The option is made for autodocs templates; these files use only its documented effect: the file is not indexed.
- The first paragraph is the section description: the first paragraph of the notes column or, in a full-width section, of the body.
- The rest of the file is the notes of the section. In a full-width section, it is the content of the section (the note table of Accessibility, the code of HTML Structure).
- A comment goes only where an edit could break something, for example the list of states, which the Skeleton export reads. Write it on one line (`{/* ... */}`): Prettier breaks a comment over several lines.

A page imports the file and places it in its column. The title comes first, then the body, then the notes:

```mdx
import StatesNotes from './sections/states.mdx';

<div className="docs-section">

## States

<div className="docs-section-body">

<Canvas of={Stories.StatesDefault} sourceState="none" />

</div>
<div className="docs-section-notes">

<StatesNotes />

</div>
</div>
```

A full-width section adds the `docs-section--full` class and has no notes column. On the Docs page, the title of a section of one variant starts with the variant label:

```mdx
## <span className="docs-section-variant">Default</span> Skeleton
```

## Editing the docs

- **To change a text,** edit its file in `sections/`. The pages that show it change too.
- **To change the layout of a page** (the order of the sections, canvases, controls), edit the page (`<token>.mdx`, `<token>-common.mdx` or `<token>-<variant>.mdx`). Keep the first part of the Docs page in the same order as the Common page, and its variant blocks in the same order as the variant pages.
- **The text in the header** of each page (the short description under the title) is written in the page itself, as a string expression: `{'...'}`. Plain text on its own lines inside a JSX element becomes a Markdown paragraph in MDX, so the description would get a second `<p>` inside it, with the margin of Storybook.

## Known limits

- When one page shows two section files with the same subtitles, the subtitles get the same `id`, because each file numbers its own headings. The anchor link of the second one goes to the first one.
- On the Docs page, the Skeleton notes of Default and Inline have the same subtitles (Dimensions and spacing, Error icon, Responsive behavior), so they get the same `id`.
- The Skeleton sections show their title and their notes for now. The body is empty until the Skeleton canvas is ready.
