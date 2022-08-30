import { GetApp, ViewColumn } from '@mui/icons-material';
import { Icon, IconButton, Popover, styled, Toolbar, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import cx from 'classnames';
import { isFunction } from 'lodash';
import React from 'react';
import { DropResult, ResponderProvided } from 'react-beautiful-dnd';
import { TableAction, TableColumn, TableColumnId, TableComponents, TableIcons, TableOptions } from '../types';
import { generateNamesObject } from '../utils';
import { TableViewColumns } from './TableViewColumns';

export const muiTableToolbarClasses = generateNamesObject(
    ['toolbar', 'highlight', 'spacer', 'actions', 'title', 'viewColumnsContainer'],
    'MuiTableToolbar',
);

const Root = styled(Box)(({ theme }) => ({
    [`& .${muiTableToolbarClasses.toolbar}`]: {
        paddingLeft: 16,
        paddingRight: 8,
        // flexBasis: 64,
        flexShrink: 0,
    },
    [`& .${muiTableToolbarClasses.highlight}`]: {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.secondary.dark,
    },
    [`& .${muiTableToolbarClasses.spacer}`]: {
        flex: '1 1 100%',
    },
    [`& .${muiTableToolbarClasses.actions}`]: {
        color: theme.palette.text.secondary,
        display: 'inline-flex',
    },
    [`& .${muiTableToolbarClasses.title}`]: {
        flex: '0 0 auto',
    },
    [`& .${muiTableToolbarClasses.viewColumnsContainer}`]: {},
}));

export interface TableToolbarProps<T = any> extends Pick<TableComponents, 'actions'> {
    title?: string;
    columns: readonly TableColumn<T>[];
    selectionCount: number;
    options: TableOptions;
    icons?: TableIcons;
    onColumnToggle: (columnId: TableColumnId, display?: boolean) => void;
    onColumnDrag: (result: DropResult, provided: ResponderProvided) => void;
    onColumnsReset: () => void;
    onDataExport: () => void;
}

interface State {
    viewColumnsAnchor: Element | null;
}

export class TableToolbar extends React.Component<TableToolbarProps, State> {
    state: State = {
        viewColumnsAnchor: null,
    };

    toggleViewColumns = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.target as HTMLElement;
        this.setState((prevState) => ({
            viewColumnsAnchor: prevState.viewColumnsAnchor ? null : target,
        }));
    };

    renderAction = (action: TableAction) => {
        return (
            <Tooltip title={action.name}>
                <div>
                    <IconButton onClick={action.callback} disabled={action.disabled}>
                        {action.icon ? action.icon : <Icon className={action.className} />}
                    </IconButton>
                </div>
            </Tooltip>
        );
    };

    render() {
        const { title, columns, actions, options, icons, onColumnToggle, onColumnDrag, onColumnsReset, onDataExport } =
            this.props;

        const { viewColumnsAnchor } = this.state;

        const { exportable, showTitle, showActions } = options;

        return (
            <Root>
                <Toolbar
                    className={cx(muiTableToolbarClasses.toolbar, {
                        // [classes.highlight]: selectionCount > 0,
                    })}
                >
                    {showTitle && (
                        <Box className={muiTableToolbarClasses.title}>
                            {/* {selectionCount > 0 ? (
                                <Typography color="inherit" variant="subtitle1">
                                    {selectionCount} selected
                                </Typography>
                            ) : ( */}
                            <Typography variant="h6">{title}</Typography>
                            {/* )} */}
                        </Box>
                    )}

                    <Box className={muiTableToolbarClasses.spacer} />

                    {showActions && (
                        <Box className={muiTableToolbarClasses.actions}>
                            {/* {selectionCount > 0 ? (
                                this.renderAction({
                                    name: 'Delete',
                                    icon: <Delete/>,                            
                                })
                            ) : ( */}
                            <>
                                {actions &&
                                    (isFunction(actions)
                                        ? actions()
                                        : actions.map((action, index) => {
                                              return (
                                                  <React.Fragment key={index}>
                                                      {this.renderAction(action)}
                                                  </React.Fragment>
                                              );
                                          }))}

                                {exportable &&
                                    this.renderAction({
                                        name: 'Export',
                                        icon: icons?.toolbar?.export || <GetApp />,
                                        callback: onDataExport,
                                    })}

                                {this.renderAction({
                                    name: 'Columns',
                                    icon: icons?.toolbar?.columns || <ViewColumn />,
                                    callback: (event: React.MouseEvent<HTMLElement>) => this.toggleViewColumns(event),
                                })}
                            </>
                            {/* )} */}
                        </Box>
                    )}
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
                        className: muiTableToolbarClasses.viewColumnsContainer,
                        style: {
                            transform: viewColumnsAnchor ? 'none !important' : '', // https://github.com/atlassian/react-beautiful-dnd/issues/1329
                        },
                    }}
                >
                    <TableViewColumns
                        columns={columns}
                        onColumnToggle={onColumnToggle}
                        onColumnDrag={onColumnDrag}
                        onColumnsReset={onColumnsReset}
                    />
                </Popover>
            </Root>
        );
    }
}
