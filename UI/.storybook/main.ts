/* Github Flavoured Markdown */
import remarkGfm from 'remark-gfm';
import { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
    stories: [
        '../stories/**/*.mdx',
        '../stories/**/*.stories.@(js|jsx|ts|tsx)',
        '../design-system/**/*.mdx',
        '../design-system/**/*.stories.@(js|jsx|ts|tsx)',
    ],

    staticDirs: [
        '../public',
        '../src/static', // Include the static folder
    ],

    addons: [
        '@storybook/addon-a11y',
        'storybook-addon-deep-controls',
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
        '@etchteam/storybook-addon-status',
    ],

    framework: {
        name: '@storybook/web-components-vite',
        options: {},
    },

    features: {
        actions: false,
        backgrounds: false,
    },
};

export default config;
