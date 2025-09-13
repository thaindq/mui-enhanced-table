import { Clear, Search } from '@mui/icons-material';
import {
    Box,
    IconButton,
    InputAdornment,
    inputBaseClasses,
    styled,
    TextField,
    TextFieldProps,
    useTheme,
} from '@mui/material';
import { useUpdateEffect } from '@react-hookz/web';
import React, { useContext, useRef, useState } from 'react';
import { MuiTableContext } from '../Table';
import { generateNamesObject } from '../utils';

export const muiTableSearchClasses = generateNamesObject(['root', 'input'], 'MuiTableSearch');

export type TableSearchProps = Partial<Omit<TextFieldProps, 'onChange'>> & {
    onChange: (value: string) => void;
};

const Container = styled(Box)(({ theme }) => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    transition: 'all ease 0.5s',
    [`& .${inputBaseClasses.root}`]: {
        borderRadius: theme.shape.borderRadius,
    },
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
                slotProps={{
                    ...textFieldProps.slotProps,
                    input: {
                        ref: inputRef,
                        disableUnderline: true,
                        startAdornment: (
                            <InputAdornment position="start" style={{ color: 'inherit' }}>
                                <Search color="inherit" />
                            </InputAdornment>
                        ),
                        endAdornment: (
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
                        ),
                        ...textFieldProps.slotProps?.input,
                    },
                }}
            />
        </Container>
    );
};
