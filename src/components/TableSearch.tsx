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
} from '@mui/material';
import React, { useRef, useState } from 'react';
import { useUpdateEffect } from '@react-hookz/web';
import { TableRow } from '../types';
import { generateNamesObject } from '../utils';

export interface TableSearchProps<T = any> {
    displayData: readonly TableRow<T>[];
    onChange: (value: string) => void;
}

const Container = styled(Box)(({ theme }) => ({
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    transition: 'all ease 0.5s',
    backgroundColor: alpha(theme.palette.action.hover, 0.02),
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    [`& .${tableSearchClasses.input}`]: {
        color: 'inherit',
        [`& .${outlinedInputClasses.notchedOutline}`]: {
            borderWidth: 0,
            // borderColor: theme.palette.action.hover
        },
        [`& .${inputBaseClasses.input}`]: {
            // padding: theme.spacing(1.5),
        },
    },
}));

export const TableSearch = <T = any,>({ onChange }: TableSearchProps<T>): React.ReactElement => {
    const [searchText, setSearchText] = useState('');

    useUpdateEffect(() => {
        onChange(searchText);
    }, [searchText]);

    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <Container className={tableSearchClasses.root}>
            <OutlinedInput
                fullWidth
                placeholder={'Search...'}
                className={tableSearchClasses.input}
                value={searchText}
                onChange={(event) => {
                    setSearchText(event.target.value);
                }}
                inputProps={{
                    ref: inputRef,
                }}
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

export const tableSearchClasses = generateNamesObject(['root', 'input'], TableSearch.name);
