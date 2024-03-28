import { Clear, Search } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField, TextFieldProps, styled } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
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
    displayData: readonly TableRow<T>[];
    onChange: (value: string) => void;
    TextFieldProps?: Partial<TextFieldProps>;
}

export function useFirstMountState(): boolean {
    const isFirst = useRef(true);

    if (isFirst.current) {
        isFirst.current = false;

        return true;
    }

    return isFirst.current;
}

const useUpdateEffect: typeof useEffect = (effect, deps) => {
    const isFirstMount = useFirstMountState();

    useEffect(() => {
        if (!isFirstMount) {
            return effect();
        }
    }, deps);
};

export const TableSearch = <T = any,>({ onChange, TextFieldProps }: TableSearchProps<T>): React.ReactElement => {
    const [searchText, setSearchText] = useState('');

    useUpdateEffect(() => {
        onChange(searchText);
    }, [searchText]);

    return (
        <StyledTextField
            className={muiTableSearchClasses.textField}
            value={searchText}
            onChange={(event) => {
                setSearchText(event.target.value);
            }}
            variant="standard"
            {...TextFieldProps}
            InputProps={{
                startAdornment: <InputAdornment position="start">{<Search />}</InputAdornment>,
                endAdornment: !searchText ? null : (
                    <InputAdornment position="end">
                        <IconButton
                            className={muiTableSearchClasses.clearSearchButton}
                            onClick={() => setSearchText('')}
                        >
                            <Clear fontSize="inherit" />
                        </IconButton>
                    </InputAdornment>
                ),
                ...TextFieldProps?.InputProps,
            }}
        />
    );
};
