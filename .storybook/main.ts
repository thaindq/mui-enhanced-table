module.exports = {
    addons: [
        '@storybook/addon-docs',
        '@storybook/addon-essentials',
        '@storybook/addon-storysource',
    ],
    stories: ['../stories/**/*.stories.@(j|t)sx'],
    webpackFinal: async (config) => {
        return {
            ...config,
            resolve: {
                ...config.resolve,
                alias: {
                    ...config.resolve.alias,
                    "@emotion/core": require.resolve('@emotion/react'),
                    "emotion-theming": require.resolve('@emotion/react'),
                    "@emotion/styled": require.resolve('@emotion/styled'),
                },
            },
        }
    }
};