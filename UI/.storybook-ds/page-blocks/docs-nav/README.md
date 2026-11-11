# docs-nav

A page navigation for the doc pages of the docs Storybook. It is a documentation component, not a design system component: it is part of the page around the components, and no product screen uses it. It sits at the bottom of the docs header, with one link per section of the page, and it sticks to the top while the page scrolls.

- **What it is:** a custom element, `<docs-nav>`, around a `<nav>` with links. The CSS draws the bar and the links. A small script marks the current link, moves the line under it and turns on the background and the shadow while the bar is stuck.
- **Files:** `docs-nav.css` and `docs-nav.ts`, in this folder. Import both in `UI/.storybook-ds/preview.ts`, after `docs-code.css`. The script import has no `.ts` at the end.
- **Tokens:** base tokens only. Values with no base token are custom properties at the top of the CSS, each with a comment.

## Markup

```html
<docs-nav class="sb-unstyled">
    <nav aria-label="On this page">
        <a href="#overview">Overview</a>
        <a href="#variations">Variations</a>
        <a href="#attributes">Attributes</a>
        <a href="#states">States</a>
        <a href="#html-structure">HTML Structure</a>
        <a href="#accessibility">Accessibility</a>
        <a href="#default-skeleton">Skeleton</a>
    </nav>
</docs-nav>
```

In an MDX page, write `className` instead of `class`. Put the bar right after the docs header, with nothing between them, and write the links by hand, in the order of the sections. With anything between them, the header keeps no room for the bar, and the bar covers the description. `npm run check` fails when the bar is not right after the header.

| Part or attribute                 | What it does                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `<docs-nav>`                      | The bar. It starts the script when it enters the page and stops it when it leaves. |
| `class="sb-unstyled"`             | Keeps the Storybook styles off the links.                                          |
| `<nav aria-label="On this page">` | The row of links, and the landmark for screen readers.                             |
| `href="#id"`                      | The id of a heading inside a `.docs-section`. The link points to that section.     |
| `aria-current="true"`             | Set by the script on the current link. Do not write it by hand.                    |
| `data-stuck`, `data-ready`        | Set by the script on `<docs-nav>`: the bar is stuck, and the line can slide.       |
| `data-label`                      | Set by the script on each link. It is a copy of the text, for the width reserve.   |

**One link for two sections.** When two sections belong together, like the two Skeleton sections, link only the first one. The link stays current while the second section is on screen.

## Layout

| Part       | Value                                                                                                                                                                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bar        | At the bottom of the docs header, in the 56px that the header keeps for it. Its bottom sits on the bottom border of the header. While it is stuck, it uses the full width of the page. No margin under it: the first section starts right under the header, and its title is 32px down. |
| Header     | When the docs header comes right before the bar, its bottom padding is 24 + 56px instead of 32px, and the Figma link moves up by the same amount. A header with no bar after it does not change. `docs-nav.css` makes this change.                                                      |
| Links      | 16px of padding, so the text lines up with the section titles (16 + 32 = 48px from the edge). At 600px and below, 16 + 24 = 40px, like the sections.                                                                                                                                    |
| Background | None until the bar is stuck: the header shows through it. While it is stuck, `--base-color-neutral-10` at 85%, with a 4px blur of what passes under it.                                                                                                                                 |
| Gray line  | 1px of `--base-color-neutral-40`, under the whole bar, from edge to edge, only while the bar is stuck. Before that, the bottom border of the header is in its place.                                                                                                                    |
| Blue line  | 3px of `--base-color-primary-blue-50`, under the current link. It sits on the bottom border of the header, and on the gray line while the bar is stuck.                                                                                                                                 |
| Shadow     | `0 2px 8px` black at 8%, only while the bar is stuck.                                                                                                                                                                                                                                   |
| Stop point | A click scrolls the section to 56px from the top, right under the bar. With the 32px padding of the section, its title is then 32px under the bar, as under the header at the top of the page. It is the `scroll-margin-top` of `.docs-section`.                                        |

## States and motion

| State          | What the user sees                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Link           | Barlow Regular, `--base-color-neutral-70`.                                                                                                                |
| Current link   | Barlow Medium, `--base-color-primary-blue-50`, with the blue line under it. Each link keeps the width of its Medium text, so the other links do not move. |
| Hover          | The text turns `--base-color-primary-blue-50` in 80ms. Only with a mouse (`hover: hover`).                                                                |
| Focus          | A 2px `--base-color-primary-blue-50` ring inside the link, on keyboard focus only. It is inside because the row clips anything outside it.                |
| Section change | The blue line slides to the new link, and its width changes to the new width. It uses a 160ms critical spring (no overshoot).                             |
| Stuck          | The background, the gray line and the shadow fade in, in 80ms. The blur turns on at once.                                                                 |
| Click          | The page scrolls to the section. The blue line goes straight to the clicked link, without stopping at the links between.                                  |
| Narrow screen  | When the links do not fit, the row scrolls sideways, with no scrollbar, and the current link moves to the middle of the row.                              |

The hover styles are allowed here. The rule "no hover styles" is for design system components, not for documentation components.

**Reduced motion.** With `prefers-reduced-motion: reduce`, the blue line jumps to the new link, and a click scrolls the page at once. The color fades stay, because they do not move anything.

## How the script finds the current link

- The current link is the last one whose section has reached the stop point (right under the bar).
- At the end of the page, the last link is current, because the last section may be too short to reach the stop point.
- After a click, the clicked link stays current until the scroll ends, or until the user scrolls, touches the screen or presses a key.
- A click does not change the address of the page (no `#id` in the URL).

## Accessibility

- It is a navigation with links, not tabs. The current link has `aria-current="true"`, so a screen reader announces it as "current".
- The `<nav>` has the name "On this page", so it shows in the list of landmarks.
- Keyboard: Tab moves between the links, and Enter scrolls to the section. After the scroll, the focus stays on the link.
- The current link differs from the others by color, by weight and by the blue line, not by color only.
- Pattern: ARIA, `aria-current`: https://www.w3.org/TR/wai-aria-1.2/#aria-current

## Contrast

Measured on `--base-color-neutral-10` (`#fafafa`), the color of the bar. The links (`--base-color-neutral-70`) are 5.15:1, and the current link and the blue line (`--base-color-primary-blue-50`) are 8.12:1. Text needs 4.5:1 (WCAG 2.2, 1.4.3) and a control needs 3:1 (1.4.11). The gray line is 1.30:1. It only separates the bar from the page, so it has no contrast rule.

## Points to review

- **Focus after a click.** The focus stays on the link. To move it to the section, each section needs `tabindex="-1"`, and the CSS needs a rule for the focus of a section.
- **Other doc pages.** For now, only the Summary page of a-singleline has the bar.
- **Links and sections.** The links are written by hand. When a section is added, removed or renamed, its link must change too: the `href` is the id of the section title (lowercase, spaces become hyphens). `npm run check` compares the links with the sections of each page.

## Scope

The bar has hover, focus, the current link, the stuck shadow and the sliding line. The links are written by hand in each page. The script does not read the headings of the page.
