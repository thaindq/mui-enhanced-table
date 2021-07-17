import React from 'react';
import { ThemeProvider, createTheme, StyledEngineProvider, CssBaseline } from '@material-ui/core';
import { StylesProvider, jssPreset } from '@material-ui/styles';
import { create } from 'jss';

const jss = create({ plugins: [...jssPreset().plugins] });
const theme = createTheme();

export const decorators = [
    (storyFn: Function) => (
        <StyledEngineProvider injectFirst={true}>
            <ThemeProvider theme={theme}>{storyFn()}</ThemeProvider>
        </StyledEngineProvider>
    ),
];
