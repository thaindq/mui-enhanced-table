import { IconButton, Theme } from '@mui/material';
import { FirstPage, KeyboardArrowLeft, KeyboardArrowRight, LastPage } from '@mui/icons-material';
import { createStyles, WithStyles, withStyles } from '@mui/styles';
import React from 'react';
import { TablePaginationActionsProps } from '@mui/material/TablePagination/TablePaginationActions';

const styles = (theme: Theme) =>
    createStyles({
        root: {
            flexShrink: 0,
            color: theme.palette.text.secondary,
            marginLeft: theme.spacing(2.5),
        },
    });

class TablePaginationActions extends React.Component<TablePaginationActionsProps & WithStyles<typeof styles>> {
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
        const { classes, count, page, rowsPerPage } = this.props;

        return (
            <div className={classes.root}>
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
            </div>
        );
    }
}

export default withStyles(styles, { name: 'MuiEnhancedTablePaginationActions' })(TablePaginationActions);
