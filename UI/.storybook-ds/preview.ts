import type { Preview } from '@storybook/html-vite';

// Only the Ipsos tokens and fonts load here.
// Each component and its stories bring their own CSS.
import '../design-system/tokens/tokens.css';
import '../design-system/assets/fonts/fonts.css';

const preview: Preview = {
    parameters: {
        layout: 'centered',
    },
};

export default preview;
