# Atom page template

The structure of every atom doc page. The reference page is `components/atoms/a-singleline/a-singleline.mdx`.

Storybook does not read this folder: `.storybook-ds/main.ts` loads only `.mdx` and `.stories.*` files, and the template is a `.mdx.txt` file.

## How to use it

1. Copy `atom-page.mdx.txt` to `components/atoms/<token>/<token>.mdx`.
2. Replace the placeholders in capitals: `TOKEN`, `NAME`, `RENDER` (the exported render of the component, for example `singleline`), `ID` and the text placeholders.
3. Write the text from the reference doc of the component. Do not import a Markdown file.
4. Add the stories that the sections need (below).

## Sections

- **Summary:** name, level, token, the description sentence, the Playground canvas and its Controls. Story: `Playground`.
- **Variations:** one canvas and a `Controls` block with only the controls of this section, then the sentence and one `###` heading per property. Story: `Variations`. Without variations, one sentence says so, and the canvas and the controls are left out.
- **States:** one canvas and a `Controls` block with only the controls of this section, then the sentence, the list of states and the sentence about combinations. Active is a `State` control, forced with the pseudo-states addon. Story: `States`. When every state comes from child components, only the text.
- **Skeleton:** the sentence, then one `###` heading per group (Dimensions and spacing, a part such as an icon, Responsive behavior). No story, unless the text needs an extra canvas.
- **Accessibility:** one `###` heading per topic with its notes, then `#### References:` with the links and the WCAG criteria.
- **HTML Structure:** the HTML from the exported render and the CSS file, each in a `Source` block with its copy button.
- **Extra canvas in a section (optional):** a single case that the text needs, one story per case.
- **Extra sections (optional):** content that does not fit the sections above, after HTML Structure.

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
- Cardinality of sub-components. Atoms have none.
