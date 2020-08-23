import { createStyles, Icon, IconButton, Popover, Theme, Toolbar, Tooltip, Typography, withStyles } from '@material-ui/core';
import { ViewColumn, GetApp } from '@material-ui/icons';
import { WithStyles } from '@material-ui/styles';
import cx from 'classnames';
import React from 'react';
import _ from 'lodash';
import TableViewColumns from './TableViewColumns';
import { TableAction, TableColumn, TableColumnId, TableComponents, TableOptions } from '..';
import { DropResult, ResponderProvided } from 'react-beautiful-dnd';

const styles = (theme: Theme) => createStyles({
    root: {
        paddingLeft: 16,
        paddingRight: 8,
        // flexBasis: 64,
        flexShrink: 0,
    },
    highlight: {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.secondary.dark,
    },
    spacer: {
        flex: '1 1 100%',
    },
    actions: {
        color: theme.palette.text.secondary,
        display: 'inline-flex',
    },
    title: {
        flex: '0 0 auto',
    },
});

interface TableToolbarProps extends Pick<TableComponents, 'actions'> {
    title?: string;
    columns: readonly TableColumn[];
    selectionCount: number;
    options: TableOptions;
    onColumnToggle: (columnId: TableColumnId, display?: boolean) => void;
    onColumnDrag: (result: DropResult, provided: ResponderProvided) => void;
    onColumnsReset: () => void;
    onDataExport: () => void;
}

interface State {
    viewColumnsAnchor: Element | null,
}

class TableToolbar extends React.Component<TableToolbarProps & WithStyles<typeof styles>, State> {
    state: State = {
        viewColumnsAnchor: null,
    }

    toggleViewColumns = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.target as HTMLElement;
        this.setState(prevState => ({
            viewColumnsAnchor: !!prevState.viewColumnsAnchor ? null : target,
        }));
    }

    renderAction = (action: TableAction) => {
        return (
            <Tooltip title={action.name}>
                <div>
                    <IconButton onClick={action.callback} disabled={action.disabled}>
                        {!!action.icon ? action.icon : <Icon className={action.className}/>}
                    </IconButton>
                </div>
            </Tooltip>
        );
    }

    render() {
        const {
            classes,
            title,
            columns,
            selectionCount,
            actions,
            options,
            onColumnToggle,
            onColumnDrag,
            onColumnsReset,
            onDataExport
        } = this.props;

        const {
            viewColumnsAnchor
        } = this.state;

        const {
            exportable,
            showTitle,
            showActions,
        } = options;

        return (
            <>
                <Toolbar
                    className={cx(classes.root, {
                        // [classes.highlight]: selectionCount > 0,
                    })}>

                    {showTitle &&
                        <div className={classes.title}>
                            {/* {selectionCount > 0 ? (
                                <Typography color="inherit" variant="subtitle1">
                                    {selectionCount} selected
                                </Typography>
                            ) : ( */}
                                <Typography variant="h6">
                                    {title}
                                </Typography>
                            {/* )} */}
                        </div>
                    }

                    <div className={classes.spacer} />

                    {showActions && 
                        <div className={classes.actions}>
                            {/* {selectionCount > 0 ? (
                                this.renderAction({
                                    name: 'Delete',
                                    icon: <Delete/>,                            
                                })
                            ) : ( */}
                                <>
                                    {actions && (_.isFunction(actions) 
                                        ? actions() 
                                        : actions.map((action, index) => {
                                            return (
                                                <React.Fragment key={index}>
                                                    {this.renderAction(action)}
                                                </React.Fragment>
                                            );
                                    }))}

                                    {exportable && this.renderAction({
                                        name: 'Export',
                                        icon: <GetApp />,
                                        callback: onDataExport,
                                    })}

                                    {this.renderAction({
                                        name: 'Columns',
                                        icon: <ViewColumn/>,
                                        callback: (event: React.MouseEvent<HTMLElement>) => this.toggleViewColumns(event)
                                    })}
                                </>
                            {/* )} */}
                        </div>
                    }
                </Toolbar>

                <Popover
                    disablePortal
                    open={!!viewColumnsAnchor}
                    anchorEl={viewColumnsAnchor}
                    onClose={this.toggleViewColumns}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    PaperProps={{
                        style: {
                            transform: !!viewColumnsAnchor ? 'none !important' : '' // https://github.com/atlassian/react-beautiful-dnd/issues/1329
                        }
                    }}
                >
                    <TableViewColumns
                        columns={columns}
                        onColumnToggle={onColumnToggle}
                        onColumnDrag={onColumnDrag}
                        onColumnsReset={onColumnsReset}
                    />
                </Popover>
            </>
        );
    }
}

export default withStyles(styles, { name: 'MuiEnhancedTableToolbar' })(TableToolbar);