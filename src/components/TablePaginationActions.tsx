import { FirstPage, KeyboardArrowLeft, KeyboardArrowRight, LastPage } from '@mui/icons-material';
import { IconButton, styled } from '@mui/material';
import { TablePaginationActionsProps } from '@mui/material/TablePagination/TablePaginationActions';
import { Box } from '@mui/system';
import React from 'react';
import { TableIcons } from '../types';
import { generateNamesObject } from '../utils';

export const muiTablePaginationActionsClasses = generateNamesObject(
    ['root', 'firstPageButton', 'previousPageButton', 'nextPageButton', 'lastPageButton'],
    'MuiTablePaginationActions',
);

const Root = styled(Box)(({ theme }) => ({
    flexShrink: 0,
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(2.5),
}));

export class TablePaginationActions extends React.Component<
    TablePaginationActionsProps & {
        icons?: TableIcons;
        disabled?: boolean;
    }
> {
    handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement> | null) => {
        this.props.onPageChange(event, 0);
    };

    handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement> | null) => {
        this.props.onPageChange(event, this.props.page - 1);
    };

    handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement> | null) => {
        this.props.onPageChange(event, this.props.page + 1);
    };

    handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement> | null) => {
        this.props.onPageChange(event, this.getLastPage());
    };

    getLastPage = () => {
        const { count, rowsPerPage } = this.props;
        const totalPages = count / rowsPerPage;
        return Number.isInteger(totalPages) ? totalPages - 1 : Math.floor(totalPages);
    };

    render() {
        const { page, icons, disabled } = this.props;

        return (
            <Root className={muiTablePaginationActionsClasses.root}>
                <IconButton
                    className={muiTablePaginationActionsClasses.firstPageButton}
                    onClick={this.handleFirstPageButtonClick}
                    disabled={disabled || page === 0}
                >
                    {icons?.pagination?.firstPage || <FirstPage />}
                </IconButton>

                <IconButton
                    className={muiTablePaginationActionsClasses.previousPageButton}
                    onClick={this.handleBackButtonClick}
                    disabled={disabled || page === 0}
                >
                    {icons?.pagination?.previousPage || <KeyboardArrowLeft />}
                </IconButton>

                <IconButton
                    className={muiTablePaginationActionsClasses.nextPageButton}
                    onClick={this.handleNextButtonClick}
                    disabled={disabled || page >= this.getLastPage()}
                >
                    {icons?.pagination?.nextPage || <KeyboardArrowRight />}
                </IconButton>

                <IconButton
                    className={muiTablePaginationActionsClasses.lastPageButton}
                    onClick={this.handleLastPageButtonClick}
                    disabled={disabled || page >= this.getLastPage()}
                >
                    {icons?.pagination?.lastPage || <LastPage />}
                </IconButton>
            </Root>
        );
    }
}
