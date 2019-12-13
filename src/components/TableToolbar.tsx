import { createStyles, Icon, IconButton, Popover, Theme, Toolbar, Tooltip, Typography, withStyles } from '@material-ui/core';
import { ViewColumn } from '@material-ui/icons';
import { WithStyles } from '@material-ui/styles';
import cx from 'classnames';
import React from 'react';
import TableViewColumns from './TableViewColumns';
import { TableAction, TableColumn } from '../../types';

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

interface Props {
    title?: string;
    columns: TableColumn[];
    selectionCount: number;
    customActions: TableAction[];
    onToggleColumn: () => void;
    onDragColumn: () => void;
}

interface State {
    viewColumnsAnchor: any,
}

class TableToolbar extends React.Component<Props & WithStyles<typeof styles>, State> {
    state: State = {
        viewColumnsAnchor: null,
    }

    toggleViewColumns = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({
            viewColumnsAnchor: !!this.state.viewColumnsAnchor ? null : event.target,
        });
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
            customActions,
            onToggleColumn,
            onDragColumn,
        } = this.props;

        const {
            viewColumnsAnchor
        } = this.state;

        return (
            <>
                <Toolbar
                    className={cx(classes.root, {
                        // [classes.highlight]: selectionCount > 0,
                    })}>

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

                    <div className={classes.spacer} />

                    <div className={classes.actions}>
                        {/* {selectionCount > 0 ? (
                            this.renderAction({
                                name: 'Delete',
                                icon: <Delete/>,                            
                            })
                        ) : ( */}
                            <>
                                {customActions && customActions.map((action, index) => {
                                    return (
                                        <React.Fragment key={index}>
                                            {this.renderAction(action)}
                                        </React.Fragment>
                                    );
                                })}

                                {this.renderAction({
                                    name: 'Columns',
                                    icon: <ViewColumn/>,
                                    callback: (event: React.MouseEvent<HTMLElement>) => this.toggleViewColumns(event)
                                })}
                            </>
                        {/* )} */}
                    </div>
                </Toolbar>

                <Popover
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
                    }}>

                    <TableViewColumns
                        columns={columns}
                        onToggleColumn={onToggleColumn}
                        onDragColumn={onDragColumn}/>
                </Popover>
            </>
        );
    }
}

export default withStyles(styles, { name: 'MuiTableToolbar' })(TableToolbar);