import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material';
import React from 'react';

const theme = createTheme();

export const decorators = [
    (Story: React.ComponentType) => {
        return (
            <ThemeProvider theme={theme}>
                <Story />
            </ThemeProvider>
        );
    },
];
