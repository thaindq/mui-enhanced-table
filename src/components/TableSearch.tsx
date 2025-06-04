import { Clear, Search } from '@mui/icons-material';
import {
    Box,
    IconButton,
    InputAdornment,
    InputProps,
    styled,
    TextField,
    TextFieldProps,
    useTheme,
} from '@mui/material';
import { useUpdateEffect } from '@react-hookz/web';
import React, { useContext, useRef, useState } from 'react';
import { MuiTableContext } from '../Table';
import { TableRow } from '../types';
import { generateNamesObject } from '../utils';

export type TableSearchProps = Partial<Omit<TextFieldProps, 'onChange'>> & {
    onChange: (value: string) => void;
};

const Container = styled(Box)(({ theme }) => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    transition: 'all ease 0.5s',
    borderRadius: theme.shape.borderRadius,
}));

export const TableSearch: React.FunctionComponent<TableSearchProps> = ({
    onChange,
    placeholder,
    ...textFieldProps
}) => {
    const theme = useTheme();
    const [searchText, setSearchText] = useState('');
    const {
        options: { size },
    } = useContext(MuiTableContext);

    useUpdateEffect(() => {
        onChange(searchText);
    }, [searchText]);

    const inputRef = useRef<HTMLInputElement>(null);
    const inputProps = {
        startAdornment: (
            <InputAdornment position="start" style={{ color: 'inherit' }}>
                <Search color="inherit" />
            </InputAdornment>
        ),
        endAdornment: (
            <InputAdornment position="end" style={{ display: searchText ? undefined : 'none', color: 'inherit' }}>
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
        ),
        ...textFieldProps.InputProps,
        ...textFieldProps.slotProps?.input,
        ref: inputRef,
    };

    return (
        <Container className={muiTableSearchClasses.root}>
            <TextField
                fullWidth
                hiddenLabel
                variant="filled"
                placeholder={placeholder ?? 'Search...'}
                className={muiTableSearchClasses.input}
                {...textFieldProps}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                size={size}
                // slotProps={{
                //     input: inputProps,
                //     ...textFieldProps.slotProps,
                // }}
                InputProps={inputProps}
            />
        </Container>
    );
};

export const muiTableSearchClasses = generateNamesObject(['root', 'input'], TableSearch.name);
