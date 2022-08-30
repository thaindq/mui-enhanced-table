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

class TablePaginationActions extends React.Component<
    TablePaginationActionsProps & {
        icons?: TableIcons;
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
        this.props.onPageChange(event, Math.max(0, Math.ceil(this.props.count / this.props.rowsPerPage) - 1));
    };

    render() {
        const { count, page, icons, rowsPerPage } = this.props;

        return (
            <Root className={muiTablePaginationActionsClasses.root}>
                <IconButton
                    className={muiTablePaginationActionsClasses.firstPageButton}
                    onClick={this.handleFirstPageButtonClick}
                    disabled={page === 0}
                >
                    {icons?.pagination?.firstPage || <FirstPage />}
                </IconButton>

                <IconButton
                    className={muiTablePaginationActionsClasses.previousPageButton}
                    onClick={this.handleBackButtonClick}
                    disabled={page === 0}
                >
                    {icons?.pagination?.previousPage || <KeyboardArrowLeft />}
                </IconButton>

                <IconButton
                    className={muiTablePaginationActionsClasses.nextPageButton}
                    onClick={this.handleNextButtonClick}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                >
                    {icons?.pagination?.nextPage || <KeyboardArrowRight />}
                </IconButton>

                <IconButton
                    className={muiTablePaginationActionsClasses.lastPageButton}
                    onClick={this.handleLastPageButtonClick}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                >
                    {icons?.pagination?.lastPage || <LastPage />}
                </IconButton>
            </Root>
        );
    }
}

export default TablePaginationActions;
