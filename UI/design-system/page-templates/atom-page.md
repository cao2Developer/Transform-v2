# Atom page template

The structure of every atom doc page. The reference page is `components/atoms/a-singleline/a-singleline.mdx`.

Storybook does not read this folder: `.storybook-ds/main.ts` loads only `.mdx` and `.stories.*` files, and the template is a `.mdx.txt` file.

## How to use it

1. Copy `atom-page.mdx.txt` to `components/atoms/<token>/<token>.mdx`.
2. Replace the placeholders in capitals: `TOKEN`, `NAME`, `RENDER` (the exported render of the component, for example `singleline`), `ID` and the text placeholders.
3. Write the text from the reference doc of the component. Do not import a Markdown file.
4. Add the stories that the sections need (below).

## Layout

The page starts with the title (`# NAME`) and the line with the level and the token. Then each section is one row with two columns. The styles are in `.storybook-ds/docs.css`. There is no table of contents.

- `docs-section`: one section. A line on top separates it from the section above.
- `docs-section-notes`: the left column, with the section title (`##`) and the notes.
- `docs-section-body`: the right column. It starts with the description sentence of the section, then the canvas and the controls. The description lines up with the baseline of the section title.
- `docs-note-grid` and `docs-note`: notes side by side in the body, two per row, as in Accessibility. A note is a `###` heading, the text and, last, the list of links to its sources. The last list of a note gets a line on top and a link icon before each link.

Below 1024px wide, the body goes under the notes. Every canvas is at least 160px high, so it keeps its size when a control changes the story.

## MDX format

Markdown inside a `<div>` needs two things. Without them, MDX does not read the Markdown.

- The `<div>` and `</div>` tags start at the beginning of the line, with no indentation. With indentation, MDX reads the Markdown as a code block.
- A blank line after the opening tag of a column or a note, and before its closing tag.

## Writing the text

- Write the notes as short paragraphs. Use a list only when each item has a label, as in `- **Default:** primary input fields in forms.` Lists have no bullets.
- The first paragraph of the body is the description sentence. Do not start the body with another paragraph.
- Code terms between backticks (token names, attributes, keys) show as text with a dotted underline.

## Sections

- **Overview:** on the left, the title. On the right, the description of the component, the Playground canvas and its Controls. Story: `Playground`.
- **Variations:** on the left, the title and one `###` heading per property, with a list of its options. On the right, the sentence, one canvas and a `Controls` block with only the controls of this section. Story: `Variations`. Without variations, the sentence says so, and the canvas and the controls are left out.
- **States:** on the left, the title, the list of states and the sentence about combinations. On the right, the sentence, one canvas and a `Controls` block with only the controls of this section. Active is a `State` control, forced with the pseudo-states addon. Story: `States`. When every state comes from child components, only the text.
- **Skeleton:** on the left, the title and one `###` heading per group (Dimensions and spacing, a part such as an icon, Responsive behavior). On the right, the sentence. No story, unless the text needs an extra canvas.
- **Accessibility:** on the left, the title. On the right, the fixed description sentence of the template and a note grid with one note per topic: the `###` heading, the text, then the links with their WCAG criteria. No "References" heading.
- **HTML Structure:** on the left, the title. On the right, the fixed sentence of the template, then the HTML from the exported render and the CSS file, each in a `Source` block with its copy button.
- **Extra canvas in a section (optional):** a single case that the text needs, one story per case.
- **Extra sections (optional):** content that does not fit the sections above, after HTML Structure, with the same two columns.

## Stories

- `Variations`, `States` and the extra canvases have `tags: ['!dev']`. They show only on the Docs page.
- The `Playground` has no `!dev`. It shows in the sidebar, under Docs, and on the Docs page.
- The meta sets `controls: { disable: true }`, and the `Playground` turns it back on. Variations and States show only the controls of their section, with `include` on the `Controls` block. `include` matches the `name` of each argType (`'Text alignment'`), not the arg key (`align`). Each control has a short description.
- The canvases show the component alone, with no label or message around it. A hidden name keeps the field named for screen readers (`docField` in `a-singleline.stories.ts`).
- The stories file exports the render of the component and `defaultArgs`, so the HTML Structure section shows the real HTML.
- Every canvas uses `sourceState="none"`. The HTML Structure section shows the code.

## Token names

In the text, a token is written as its CSS variable name between backticks, as in the `tokens` folder (for example `--space-lg`, `--radius-xs`, `--border-width-default`). Do not use the Figma variable names (`dimension.space.lg`).

## Not in the atom template

- Status badge.
- Skeleton diagram.
- Table of contents.
- Cardinality of sub-components. Atoms have none.
