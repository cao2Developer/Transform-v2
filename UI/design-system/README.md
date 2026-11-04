# Design system docs

New documentation for the Ipsos Transform design system. It runs as a separate Storybook from the current one (`.storybook/`).

- The components in this folder are temporary. They are built only for the documentation and follow the new Figma designs. They will be replaced by the final components when the codebase is refactored.
- This folder does not import anything from `src/`, and `src/` does not import anything from this folder.

## Run it

From `UI/`:

```bash
./node_modules/.bin/storybook dev -c .storybook-ds -p 6007 --host localhost
```

Then open http://localhost:6007.

## Folders

- `.storybook-ds/`: Storybook config for these docs.
- `design-system/`: pages, components and their stories.
- `design-system/components/`: the components. How each component folder is organized: `components/README.md`.
