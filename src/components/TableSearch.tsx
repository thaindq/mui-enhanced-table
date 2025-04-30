import { Clear, Search } from '@mui/icons-material';
import {
    alpha,
    Box,
    IconButton,
    InputAdornment,
    inputBaseClasses,
    OutlinedInput,
    outlinedInputClasses,
    styled,
    useTheme,
} from '@mui/material';
import React, { useContext, useRef, useState } from 'react';
import { useUpdateEffect } from '@react-hookz/web';
import { TableRow } from '../types';
import { generateNamesObject } from '../utils';
import { MuiTableContext } from '../Table';

export interface TableSearchProps<T = any> {
    placeholder?: string;
    displayData: readonly TableRow<T>[];
    onChange: (value: string) => void;
}

const Container = styled(Box)(({ theme }) => ({
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    transition: 'all ease 0.5s',
    backgroundColor: alpha(theme.palette.action.hover, 0.02),
    '&:is(:hover, :focus-within)': {
        backgroundColor: theme.palette.action.hover,
    },
    [`& .${muiTableSearchClasses.input}`]: {
        color: 'inherit',
        [`& .${outlinedInputClasses.input}`]: {
            paddingLeft: 0,
        },
        [`& .${outlinedInputClasses.notchedOutline}`]: {
            borderWidth: 0,
        },
    },
}));

export const TableSearch = <T = any,>({ onChange, placeholder }: TableSearchProps<T>): React.ReactElement => {
    const theme = useTheme();
    const [searchText, setSearchText] = useState('');
    const {
        options: { size },
    } = useContext(MuiTableContext);

    useUpdateEffect(() => {
        onChange(searchText);
    }, [searchText]);

    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <Container className={muiTableSearchClasses.root}>
            <OutlinedInput
                fullWidth
                placeholder={placeholder ?? 'Search...'}
                className={muiTableSearchClasses.input}
                value={searchText}
                onChange={(event) => {
                    setSearchText(event.target.value);
                }}
                inputProps={{
                    ref: inputRef,
                }}
                sx={
                    size === 'small'
                        ? {
                              [`& .${inputBaseClasses.input}`]: {
                                  padding: theme.spacing(1.5),
                              },
                          }
                        : undefined
                }
                startAdornment={
                    <InputAdornment position="start" style={{ color: 'inherit' }}>
                        <Search color="inherit" />
                    </InputAdornment>
                }
                endAdornment={
                    <InputAdornment
                        position="end"
                        style={{ display: searchText ? undefined : 'none', color: 'inherit' }}
                    >
                        <IconButton
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setSearchText('');
                                if (inputRef.current) {
                                    inputRef.current.focus();
                                }
                            }}
                        >
                            <Clear fontSize="small" />
                        </IconButton>
                    </InputAdornment>
                }
            />
        </Container>
    );
};

export const muiTableSearchClasses = generateNamesObject(['root', 'input'], TableSearch.name);
