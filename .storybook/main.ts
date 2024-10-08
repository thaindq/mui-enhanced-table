import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
    addons: [
        '@storybook/addon-docs',
        '@storybook/addon-essentials',
        '@storybook/addon-storysource',
    ],

    stories: ['../stories/**/*.stories.@(j|t)sx'],
    framework: '@storybook/react-vite',
    docs: {
        autodocs: true,
    },
    typescript: {
        reactDocgen: 'react-docgen-typescript'
    }
};

export default config;