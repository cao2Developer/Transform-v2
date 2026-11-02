import type { Preview } from '@storybook/html-vite';
import { create } from 'storybook/theming';

// Only the Ipsos tokens and fonts, and the docs page styles, load here.
// Each component and its stories bring their own CSS.
import '../design-system/tokens/tokens.css';
import '../design-system/assets/fonts/fonts.css';
import './docs.css';

// Docs pages use the Ipsos font.
const docsTheme = create({
    base: 'light',
    fontBase: 'var(--font-family-primary), sans-serif',
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
