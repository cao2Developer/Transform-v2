/* Github Flavoured Markdown */
import remarkGfm from 'remark-gfm';
import { StorybookConfig } from '@storybook/html-vite';

// Docs Storybook. It reads only the design-system folder.
const config: StorybookConfig = {
    stories: [
        '../design-system/**/*.mdx',
        '../design-system/**/*.stories.@(js|jsx|ts|tsx)',
    ],

    addons: [
        {
            name: '@storybook/addon-docs',
            options: {
                mdxPluginOptions: {
                    mdxCompileOptions: {
                        remarkPlugins: [remarkGfm],
                    },
                },
            },
        },
        'storybook-addon-pseudo-states',
    ],

    framework: {
        name: '@storybook/html-vite',
        options: {},
    },
};

export default config;
