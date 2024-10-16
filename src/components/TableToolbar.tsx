import { GetApp, Refresh, ViewColumn } from '@mui/icons-material';
import { Icon, IconButton, Popover, styled, Toolbar, Tooltip, Typography, Box } from '@mui/material';
import clsx from 'clsx';
import { isFunction } from 'lodash';
import React from 'react';
import { DropResult, ResponderProvided } from 'react-beautiful-dnd';
import {
    TableAction,
    TableColumn,
    TableColumnId,
    TableComponents,
    TableIcons,
    TableOptions,
    TableTranslations,
} from '../types';
import { generateNamesObject } from '../utils';
import { TableViewColumns } from './TableViewColumns';

export const muiTableToolbarClasses = generateNamesObject(
    ['toolbar', 'highlight', 'spacer', 'actions', 'title', 'viewColumnsContainer'],
    'MuiTableToolbar',
);

const Root = styled(Box)(({ theme }) => ({
    [`& .${muiTableToolbarClasses.toolbar}`]: {
        paddingLeft: 16,
        paddingRight: 16,
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
    translations?: TableTranslations;
    onColumnToggle: (columnId: TableColumnId, display?: boolean) => void;
    onColumnDrag: (result: DropResult, provided: ResponderProvided) => void;
    onColumnsReset: () => void;
    onDataExport: () => void;
    onDataRefresh?: () => void;
}

interface State {
    showViewColumns: boolean;
}

export const Action = React.forwardRef<HTMLButtonElement, TableAction>(
    ({ className, name, callback, disabled, icon }, ref) => {
        return (
            <Tooltip title={name}>
                <div>
                    <IconButton onClick={callback} disabled={disabled} ref={ref}>
                        {icon ? icon : <Icon className={className} />}
                    </IconButton>
                </div>
            </Tooltip>
        );
    },
);

export class TableToolbar extends React.Component<TableToolbarProps, State> {
    state: State = {
        showViewColumns: false,
    };

    viewColumnsButtonRef = React.createRef<HTMLButtonElement>();

    toggleViewColumns = () => {
        this.setState((prevState) => ({
            showViewColumns: !prevState.showViewColumns,
        }));
    };

    render() {
        const {
            title,
            columns,
            actions,
            options,
            icons,
            translations,
            onColumnToggle,
            onColumnDrag,
            onColumnsReset,
            onDataExport,
            onDataRefresh,
        } = this.props;

        const { showViewColumns } = this.state;
        const { exportable, showTitle, showActions } = options;

        return (
            <Root>
                <Toolbar
                    className={clsx(muiTableToolbarClasses.toolbar, {
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
                                        : actions.map(({ name, icon, callback, className }, index) => {
                                              return (
                                                  <Action
                                                      key={index}
                                                      className={className}
                                                      name={name}
                                                      icon={icon}
                                                      callback={callback}
                                                  />
                                              );
                                          }))}

                                {onDataRefresh && (
                                    <Action
                                        name={translations?.refresh ?? 'Refresh'}
                                        icon={icons?.toolbar?.refresh || <Refresh />}
                                        callback={onDataRefresh}
                                    />
                                )}

                                {exportable && (
                                    <Action
                                        name={translations?.export ?? 'Export'}
                                        icon={icons?.toolbar?.export || <GetApp />}
                                        callback={onDataExport}
                                    />
                                )}

                                <Action
                                    name={translations?.columns ?? 'Columns'}
                                    icon={icons?.toolbar?.columns || <ViewColumn />}
                                    callback={this.toggleViewColumns}
                                    ref={this.viewColumnsButtonRef}
                                />
                            </>
                            {/* )} */}
                        </Box>
                    )}
                </Toolbar>

                <Popover
                    disablePortal
                    open={!!showViewColumns}
                    anchorEl={this.viewColumnsButtonRef.current}
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
                        // style: {
                        //     transform: viewColumnsAnchor ? 'none !important' : '', // https://github.com/atlassian/react-beautiful-dnd/issues/1329
                        // },
                    }}
                >
                    <TableViewColumns
                        translations={translations}
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
