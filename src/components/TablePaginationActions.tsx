import { FirstPage, KeyboardArrowLeft, KeyboardArrowRight, LastPage } from '@mui/icons-material';
import { IconButton, styled } from '@mui/material';
import { TablePaginationActionsProps } from '@mui/material/TablePagination/TablePaginationActions';
import { Box } from '@mui/system';
import React from 'react';
import { generateNamesObject } from '../utils';

export const muiTablePaginationActionsClasses = generateNamesObject(['root'], 'MuiTablePaginationActions');

const Root = styled(Box)(({ theme }) => ({
    [`& .${muiTablePaginationActionsClasses.root}`]: {
        flexShrink: 0,
        color: theme.palette.text.secondary,
        marginLeft: theme.spacing(2.5),
    },
}));

class TablePaginationActions extends React.Component<TablePaginationActionsProps> {
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
        const { count, page, rowsPerPage } = this.props;

        return (
            <Root className={muiTablePaginationActionsClasses.root}>
                <IconButton onClick={this.handleFirstPageButtonClick} disabled={page === 0}>
                    <FirstPage />
                </IconButton>

                <IconButton onClick={this.handleBackButtonClick} disabled={page === 0}>
                    <KeyboardArrowLeft />
                </IconButton>

                <IconButton onClick={this.handleNextButtonClick} disabled={page >= Math.ceil(count / rowsPerPage) - 1}>
                    <KeyboardArrowRight />
                </IconButton>

                <IconButton
                    onClick={this.handleLastPageButtonClick}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                >
                    <LastPage />
                </IconButton>
            </Root>
        );
    }
}

export default TablePaginationActions;
