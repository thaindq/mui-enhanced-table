import { Clear, Search } from '@mui/icons-material';
import { IconButton, InputAdornment, styled, TextField, TextFieldProps } from '@mui/material';
import React from 'react';
import { TableRow } from '../types';
import { generateNamesObject } from '../utils';

export const muiTableSearchClasses = generateNamesObject(['textField', 'clearSearchButton'], 'MuiTableSearch');

const StyledTextField = styled(TextField)(({ theme }) => ({
    flexShrink: 0,
    color: theme.palette.text.secondary,
    width: '100%',
    maxWidth: 600,
    [`& .${muiTableSearchClasses.clearSearchButton}`]: {
        width: 20,
        height: 20,
        fontSize: '16px',
        '& > span': {
            position: 'absolute',
        },
    },
}));

export interface TableSearchProps<T = any> {
    searchText: string;
    displayData: readonly TableRow<T>[];
    onChange: (value: string) => void;
    TextFieldProps?: Partial<TextFieldProps>;
}

export const TableSearch = <T = any,>({
    searchText,
    onChange,
    TextFieldProps,
}: TableSearchProps<T>): React.ReactElement => {
    return (
        <StyledTextField
            className={muiTableSearchClasses.textField}
            value={searchText}
            onChange={(event) => onChange(event.target.value)}
            variant="standard"
            {...TextFieldProps}
            InputProps={{
                startAdornment: <InputAdornment position="start">{<Search />}</InputAdornment>,
                endAdornment: !searchText ? null : (
                    <InputAdornment position="end">
                        <IconButton className={muiTableSearchClasses.clearSearchButton} onClick={() => onChange('')}>
                            <Clear fontSize="inherit" />
                        </IconButton>
                    </InputAdornment>
                ),
                ...TextFieldProps?.InputProps,
            }}
        />
    );
};
