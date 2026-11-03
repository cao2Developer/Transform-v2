# New-Storybook branch

> This branch adds a new Storybook for the design system documentation. This section explains what I changed, why, and what is still open. I'm still learning this part of the setup, so some of these notes are my conclusions from what I read and tested. Please let me know if something is wrong. The original README continues below.

## Summary

- The new docs run as a separate Storybook (port 6007), next to the current one (port 6006).
- The current Storybook, its stories and the production CSS and JS did not change.
- The new components are temporary. They follow the new Figma designs and exist only for the docs, until the codebase is refactored.

## What is new

| Folder              | What it has                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `UI/.storybook-ds/` | Config of the new Storybook.                                                                                            |
| `UI/design-system/` | New tokens, Barlow and Barlow Semi Condensed fonts (local files), and the components with their stories and docs pages. |

- `UI/design-system/` does not import anything from `UI/src/`, and `UI/src/` does not import anything from `UI/design-system/`.
- The token files are in `UI/design-system/tokens/` and they are ready for review at any time. One thing I'm not sure about: `--font-family-primary` and `--font-family-secondary` have the same names as the production tokens in `UI/src/css/base/typography.css`, but different values. I think this is fine while the two Storybooks are separate, but I don't know how it should work when the new CSS moves to `UI/src/`.

## Changes outside these folders

- I added `storybook-addon-pseudo-states` 10.2.16 as a dev dependency (`UI/package.json` and `UI/npm-shrinkwrap.json`). Only the new config uses it, to show the focus state on the docs pages without clicking on the field.
- I deleted `UI/src/css/_new_doc/` in a separate commit. I created it in May 2026 for my first docs test, and I couldn't find anything that imports it. If you use it, let me know and I'll bring it back.

## Why a separate Storybook

- The new components have a different HTML structure, so, if I understood correctly, the production JS and XSL would not work with them yet.
- With a separate config, each Storybook loads only its own CSS: the new docs pages load the new CSS, and the current stories keep the production CSS and JS. Working only in new folders also avoids conflicts with the work in `master`.

## Path to production

My idea is that the new CSS is the next version of the production CSS, not a copy. I tried to follow the same structure, naming and lint rules, using the new tokens. Each file has the name of its component, so when a component is refactored, I think its new CSS could move to `UI/src/css/atoms/` and replace the old file (for example, `a-singleline.css`). I'd like to hear what you think about this.

## Run it

From `UI/`:

```bash
./node_modules/.bin/storybook dev -c .storybook-ds -p 6007 --host localhost
```

Then open http://localhost:6007. It needs Node 20.19 or newer (see Open notes).

I didn't add any scripts to `package.json`, because I wasn't sure you would want them. If a script helps, I can try to add one.

## Open notes

Things to check when there is time.

- **Publishing:** Kevin mentioned we may be able to publish this Storybook to its own URL, so the current Storybook is not overwritten. Until this is defined, I'm keeping the files of the current Storybook (`UI/.storybook/`, `UI/stories/`) in this branch. If I understood correctly, deleting them here would also delete them from `master` when the branch is merged.
- **Node version:** `UI/.nvmrc` says 20.11.0, but from what I read, Storybook 10 needs Node 20.19+ or 22.12+, and `stylelint-order` 7.0.1 needs 20.19+. Maybe `.nvmrc` could be updated, but I don't know which version you use.
- **Storybook and Vite versions:** the branch uses Storybook 10.2.16 and Vite 6.4.1. When I ran `npm audit`, it reported critical issues in Storybook (fixed in 10.6.2) and high issues in Vite (fixed in 6.4.4). From what I read in the advisories, they affect the dev server, not a built Storybook. The `package.json` range already allows Storybook 10.6.2, but I didn't update anything. I'm keeping the versions of the branch until you decide.

## Before merging into master

Remove this section (from "New-Storybook branch" to the line below), or replace it with a short note about the new docs.

---

# Transform-v2

A refactoring of the Transform project, moving it to a more modern HTML implementation

This is an Ipsos project for the Transformation of the look and feel of surveys for Healthcare. The solution is also used by PassiveObservation.

The purpose of this project is to refactor v1, using ES6/TypeScript, HTML Web Components, vanilla CSS, and better implementing atomic design principles. All refactored code can be found in the `UI` folder.

## TBC

- `npx browserslist` - what Safari versions do we need to support?
- Do we need so many font variants? Currently, only a subset of the WOFF fonts have been defined in the new CSS.
- [Do we need so many favicons](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)?
- Define naming convention for "primitive" design tokens, align with Figma, and implement automatic export:
    - See [related ClickUp task POC](https://app.clickup.com/t/8696gvh4k)
- Implement new CSS theming mechanism with "whitelabel" default theme:
    - See [UI Boilerplate theming with Parcel + Storybook](https://github.com/basher/Web-UI-Boilerplate).

## TODO

- Once refactor is completed, delete the following:
    - `Survey` and `Storybook` folders.
    - `UI/src/css/shame.css` and its import inside `UI/src/css/index.css`.
    - All references to the old Survey CSS in `UI/.storybook/preview-head.html`.
