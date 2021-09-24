import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material';
import React from 'react';

const theme = createTheme();

export const decorators = [
    (storyFn: Function) => (
        <StyledEngineProvider injectFirst={true}>
            <ThemeProvider theme={theme}>{storyFn()}</ThemeProvider>
        </StyledEngineProvider>
    ),
];
