# Components

How each component folder is organized in the docs Storybook, and why. `a-singleline` is the example in this file.

## The approach

- **One Docs page with everything.** Each component has a Docs page with every section, always in the same order: Overview, Variations, States, Skeleton, Accessibility, HTML Structure. The sections are in the same place in every component.
- **One page per variant.** When a component has variants, each variant also has its own page, with only the sections that change per variant. For `a-singleline`: States and Skeleton. A reader who only needs the Inline variant does not see notes about the Default variant.
- **Each text is written once.** The text of each section lives in its own file, in `sections/`. The pages hold only the structure (header, sections, canvases and controls) and import the text. When a text changes, every page that shows it changes too.
- **Stories at the end.** The Playground stories, one per variant, sit in their own group after the doc pages. They are kept apart from the doc pages because a doc page and a story with the same name (for example, "Default") cannot be in the same group in Storybook.

## Folder structure

```text
components/
└ atoms/
   └ a-singleline/
      ├ a-singleline.css                     the component
      ├ a-singleline.stories.ts              the stories
      ├ a-singleline.mdx                     Docs page
      ├ a-singleline-default.mdx             Default page
      ├ a-singleline-inline.mdx              Inline page
      └ sections/
         ├ a-singleline-variations.mdx
         ├ a-singleline-states.mdx
         ├ a-singleline-skeleton-default.mdx
         ├ a-singleline-skeleton-inline.mdx
         └ a-singleline-accessibility.mdx
```

## Sidebar

```text
Atoms
└ Singleline
   ├ Docs          a-singleline.mdx
   ├ Default       a-singleline-default.mdx
   ├ Inline        a-singleline-inline.mdx
   └ Playground    a-singleline.stories.ts
      ├ Default
      └ Inline
```

The order (Docs first, Playground last) is set by `storySort` in `.storybook-ds/preview.ts`, for every component.

## What each file is

| File                                       | What it has                                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<token>.css`                              | The CSS of the component. The file name is the token, so the future move to `UI/src/css/` is a one-to-one swap.                                                         |
| `<token>.stories.ts`                       | The stories. The Playground stories (one per variant) show in the sidebar. The stories that only the doc pages show (Overview, Variations, States) have the `!dev` tag. |
| `<token>.mdx`                              | The Docs page: Overview and every section.                                                                                                                              |
| `<token>-<variant>.mdx`                    | The page of one variant: the header and only the sections that change per variant. Only for components with variants.                                                   |
| `sections/<token>-<section>.mdx`           | The description and notes of one section.                                                                                                                               |
| `sections/<token>-<section>-<variant>.mdx` | The description and notes of one section for one variant, when the text changes per variant.                                                                            |

A component without variants has only `<token>.mdx` and no variant pages.

## Section files

A section file holds the text of one section: its description and its notes.

```mdx
import { Meta } from '@storybook/addon-docs/blocks';

<Meta isTemplate />

export const description =
    'The component has four states: inactive, active, error and read only.';

- **Inactive:** the field is ready to receive input.
- ...
```

- `<Meta isTemplate />` keeps the file out of the sidebar. Without it, Storybook shows every `.mdx` file as a page. The option is made for autodocs templates; these files use only its documented effect: the file is not indexed.
- `description` is the section description, the first paragraph of the body column. It is plain text, with no Markdown.
- The rest of the file is the notes of the section.

A page imports the file and places each part in its column:

```mdx
import StatesNotes, {
    description as statesDescription,
} from './sections/a-singleline-states.mdx';

<div className="docs-section">
<div className="docs-section-notes">

## States

<StatesNotes />

</div>
<div className="docs-section-body">

<p>{statesDescription}</p>

<Canvas of={Stories.StatesDefault} sourceState="none" />

</div>
</div>
```

## Editing the docs

- **To change a text,** edit its file in `sections/`. The pages that show it change too. Each file says in a comment where it is shown.
- **To change the layout of a page** (the order of the sections, canvases, controls), edit the page (`<token>.mdx` or `<token>-<variant>.mdx`).
- **The text in the header** of each page (the short description under the title) is written in the page itself.
- **HTML Structure** stays whole in the Docs page, because it shows the code of the component files.

## Known limits

- On the Docs page, the subtitles that come from two section files with the same headings (for example, the two Skeleton files) get the same `id`, because each file numbers its own headings. The anchor link of the second one goes to the first one.
