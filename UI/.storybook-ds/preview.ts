import type { Preview } from '@storybook/html-vite';
import { create } from 'storybook/theming';

// Only the Ipsos tokens and fonts, and the docs page styles, load here.
// Each component and its stories bring their own CSS.
import '../design-system/tokens/tokens.css';
import '../design-system/assets/fonts/fonts.css';
import './docs.css';
import './page-blocks/docs-header/docs-header.css';

// Docs pages use the Ipsos font and base token colors.
// The colors are hex because a theme cannot read CSS variables.
// Each one repeats the base token in its comment.
const docsTheme = create({
    base: 'light',
    fontBase: 'var(--font-family-primary), sans-serif',
    textColor: '#324371', // --base-color-neutral-80
    appBorderColor: '#d6ddeb', // --base-color-neutral-40
    inputBorder: '#d6ddeb', // --base-color-neutral-40
    appContentBg: '#fff', // --base-color-neutral-10
});

const preview: Preview = {
    parameters: {
        layout: 'centered',
        docs: {
            theme: docsTheme,
        },
    },
};

export default preview;
