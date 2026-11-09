import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// The manager (sidebar and toolbar) does not load the tokens,
// so the colors are hex. Each one repeats the base token in its comment.
const managerTheme = create({
    base: 'light',
    appBg: '#f2f4f7', // --base-color-neutral-20
});

addons.setConfig({
    panelPosition: 'right',
    theme: managerTheme,
});
