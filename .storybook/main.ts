module.exports = {
    addons: [
        '@storybook/addon-docs',
        '@storybook/addon-essentials',
        '@storybook/addon-storysource',
        '@storybook/addon-mdx-gfm',
    ],
    stories: ['../stories/**/*.stories.@(j|t)sx'],
    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },
    docs: {
        autodocs: true,
    },
};
