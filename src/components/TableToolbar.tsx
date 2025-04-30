import { GetApp, Refresh, Search, ViewColumn } from '@mui/icons-material';
import { alpha, Box, Icon, IconButton, Popover, styled, Toolbar, Tooltip, Typography } from '@mui/material';
import clsx from 'clsx';
import { isFunction } from 'lodash';
import React, { useRef } from 'react';
import { DropResult, ResponderProvided } from '@hello-pangea/dnd';
import { useToggle } from '@react-hookz/web';
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

const Root = styled(Toolbar)(({ theme }) => ({
    [`&.${muiTableToolbarClasses.toolbar}`]: {
        padding: 0,
    },
    [`&.${muiTableToolbarClasses.selectActionsContainer}`]: {
        backgroundColor: alpha(theme.palette.action.active, theme.palette.action.activatedOpacity),
        padding: theme.spacing(0, 2),
    },
    [`& .${muiTableToolbarClasses.spacer}`]: {
        flex: '1 1 100%',
    },
    [`& .${muiTableToolbarClasses.title}, .${muiTableToolbarClasses.actions}`]: {
        flex: '0 0 auto',
    },
}));

export interface TableToolbarProps<T = any> extends Pick<TableComponents, 'actions' | 'selectActions'> {
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

export const Action = React.forwardRef<HTMLButtonElement, TableAction>(
    ({ className, name, callback, disabled, icon }, ref) => {
        return (
            <Tooltip title={name}>
                <IconButton onClick={callback} disabled={disabled} ref={ref}>
                    {icon ? icon : <Icon className={className} />}
                </IconButton>
            </Tooltip>
        );
    },
);

export const MuiTableToolbar: React.FunctionComponent<TableToolbarProps> = ({
    title,
    columns,
    actions,
    selectActions,
    options,
    icons,
    translations,
    onColumnToggle,
    onColumnDrag,
    onColumnsReset,
    onDataExport,
    onDataRefresh,
    selectionCount,
}) => {
    const [showViewColumns, toggleViewColumns] = useToggle(false);
    const viewColumnsButtonRef = useRef<HTMLButtonElement>(null);
    const { exportable, showTitle, showActions } = options;
    const hasSelections = selectionCount > 0;

    const renderAction = ({ name, icon, callback, className }: TableAction, index: number) => {
        return <Action key={index} className={className} name={name} icon={icon} callback={callback} />;
    };

    return (
        <Root
            className={clsx(muiTableToolbarClasses.toolbar, {
                [muiTableToolbarClasses.selectActionsContainer]: selectionCount > 0,
            })}
        >
            <Box className={muiTableToolbarClasses.title}>
                {hasSelections ? (
                    <Typography color="inherit" variant="subtitle1">
                        {selectionCount}&nbsp;{translations?.selected ?? 'selected'}
                    </Typography>
                ) : showTitle ? (
                    <Typography variant="h6">{title}</Typography>
                ) : null}
            </Box>

            <Box className={muiTableToolbarClasses.spacer} />

            <Box className={muiTableToolbarClasses.actions}>
                {hasSelections ? (
                    isFunction(selectActions) ? (
                        selectActions()
                    ) : (
                        selectActions?.map(renderAction)
                    )
                ) : showActions ? (
                    <>
                        {isFunction(actions) ? actions() : actions?.map(renderAction)}

                        {/* {searchable && (
                                <Action
                                    name={translations?.search ?? 'Search'}
                                    icon={icons?.toolbar?.search || <Search />}
                                    callback={() => {
                                        // Implement search functionality
                                    }}
                                />
                            )} */}

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
                            callback={() => toggleViewColumns()}
                            ref={viewColumnsButtonRef}
                        />
                    </>
                ) : null}
            </Box>

            <Popover
                disablePortal
                open={!!showViewColumns}
                anchorEl={viewColumnsButtonRef.current}
                onClose={() => toggleViewColumns()}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        className: muiTableToolbarClasses.viewColumnsContainer,
                    },
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
};

export const muiTableToolbarClasses = generateNamesObject(
    ['toolbar', 'selectActionsContainer', 'spacer', 'actions', 'title', 'viewColumnsContainer'],
    MuiTableToolbar.name,
);
