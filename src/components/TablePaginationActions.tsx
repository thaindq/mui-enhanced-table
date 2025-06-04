import { FirstPage, KeyboardArrowLeft, KeyboardArrowRight, LastPage } from '@mui/icons-material';
import { Box, IconButton, styled, TablePaginationActionsProps } from '@mui/material';
import React, { useMemo } from 'react';
import { TableIcons } from '../types';
import { generateNamesObject } from '../utils';

const Root = styled(Box)(({ theme }) => ({
    marginLeft: theme.spacing(3),
    display: 'flex',
}));

export const TablePaginationActions: React.FunctionComponent<
    TablePaginationActionsProps & {
        icons?: TableIcons;
        disabled?: boolean;
    }
> = ({ page, icons, disabled, count, rowsPerPage, onPageChange }) => {
    const lastPage = useMemo(() => {
        const totalPages = count / rowsPerPage;
        return Number.isInteger(totalPages) ? totalPages - 1 : Math.floor(totalPages);
    }, [count, rowsPerPage]);

    return (
        <Root className={muiTablePaginationActionsClasses.root}>
            <IconButton
                className={muiTablePaginationActionsClasses.firstPageButton}
                onClick={(event) => onPageChange(event, 0)}
                disabled={disabled || page === 0}
            >
                {icons?.pagination?.firstPage || <FirstPage />}
            </IconButton>

            <IconButton
                className={muiTablePaginationActionsClasses.previousPageButton}
                onClick={(event) => onPageChange(event, page - 1)}
                disabled={disabled || page === 0}
            >
                {icons?.pagination?.previousPage || <KeyboardArrowLeft />}
            </IconButton>

            <IconButton
                className={muiTablePaginationActionsClasses.nextPageButton}
                onClick={(event) => onPageChange(event, page + 1)}
                disabled={disabled || page >= lastPage}
            >
                {icons?.pagination?.nextPage || <KeyboardArrowRight />}
            </IconButton>

            <IconButton
                className={muiTablePaginationActionsClasses.lastPageButton}
                onClick={(event) => onPageChange(event, lastPage)}
                disabled={disabled || page >= lastPage}
            >
                {icons?.pagination?.lastPage || <LastPage />}
            </IconButton>
        </Root>
    );
};

export const muiTablePaginationActionsClasses = generateNamesObject(
    ['root', 'firstPageButton', 'previousPageButton', 'nextPageButton', 'lastPageButton'],
    TablePaginationActions.name,
);
