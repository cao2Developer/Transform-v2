# Docs skeleton export

A Figma development plugin and two Node.js scripts that export the Skeleton section of a doc page from Figma to JSON. The Skeleton canvas page block reads the JSON. The docs Storybook does not need these files: the committed JSON is enough.

- The plugin is never published. It runs only in the Figma desktop app, imported from `manifest.json`.
- It only reads Figma. It never changes a node, a component or a variable. The Show buttons change only the selection and the view.
- Node.js only. Nothing to install, and no change to `package.json`.

## Files

| File                 | What it does                                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest.json`      | The plugin. Network access only to `http://localhost:6008`, during development.                                                                                                                            |
| `code.js`            | Reads the selected canvases, runs the checks that need Figma and sends the JSON to the receiver.                                                                                                           |
| `ui.html`            | The panel of the plugin: the canvases in order, the errors and the warnings, each with a Show button.                                                                                                      |
| `receive.mjs`        | The local receiver. It checks the JSON against the code and writes it only when there are no errors.                                                                                                       |
| `check-skeleton.mjs` | The checks against the code: the states of the doc, the tokens and their px values, and the formulas. The receiver runs it before it writes. Run alone, it checks every skeleton JSON in `design-system/`. |

## Import the plugin (once)

1. Open the Figma desktop app.
2. Menu: Plugins > Development > Import plugin from manifest.
3. Choose `UI/.storybook-ds/page-blocks/docs-skeleton/figma-export/manifest.json`.

The plugin is now in Plugins > Development > Docs skeleton export.

## Export a skeleton

1. In a terminal, start the receiver from `UI/` and leave it open:

    ```bash
    node .storybook-ds/page-blocks/docs-skeleton/figma-export/receive.mjs
    ```

2. In Figma, select the canvas frames of one component. The order of the export is the reading order on the page: rows from top to bottom, and each row from left to right.
3. Run Plugins > Development > Docs skeleton export. The panel lists the canvases in order, with the errors and the warnings.
4. For each error, click Show, fix it in Figma, then click Run again. Use selection reads a new selection.
5. With no errors, click Save JSON. The receiver checks the JSON against the code. With no errors, it writes `design-system/components/<level>/<component>/sections/skeleton.json`, and the panel shows the path. Warnings do not stop it.
6. Stop the receiver with Ctrl+C, and commit the JSON.

To test without writing in the component folders, start the receiver with `--out <folder>`.

## Checks

Each message says what to fix. The number is the check of the export contract:

- In Figma (the plugin): checks 1 to 15, and warnings 2 to 4. Check 2 only checks that `component` and `states` are filled. Check 9 only checks that each term of a formula is a number or a token name.
- Against the code (the receiver):
    - Check 2: each state of a canvas is a `###` title of `content/states.md` (one title per state: `### Inactive`).
    - Check 9: each term of a formula is a length token of `design-system/tokens/`, and the sum is the size of the Space.
    - Check 16: each token of the JSON is in `design-system/tokens/`, with the same px value (1rem is 16px).
    - Warning 1: a state of the list is in no canvas of a variant.

To check every skeleton JSON after a token change, run from `UI/`:

```bash
node .storybook-ds/page-blocks/docs-skeleton/figma-export/check-skeleton.mjs
```
