import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
    alpha,
    Box,
    Checkbox,
    CircularProgress,
    Icon,
    IconButton,
    LinearProgress,
    TableRow as MuiTableRow,
    Radio,
    Skeleton,
    styled,
    TableBody,
    TableCell,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import clsx from 'clsx';
import { isArray, isFunction, isString } from 'lodash';
import React, { useEffect } from 'react';
import { SetRequired } from 'type-fest';
import {
    FormatterProps,
    SearchMatchers,
    TableAction,
    TableColumn,
    TableComponents,
    TableIcons,
    TableOptions,
    TableProps,
    TableRow,
    TableRowId,
    TableTranslations,
} from '../types';
import { generateNamesObject } from '../utils';
import { useMeasure } from '@react-hookz/web';

const Root = styled(TableBody)(({ theme }) => ({
    position: 'relative',
    [`& .${muiTableBodyClasses.row}`]: {
        transition: 'all ease .2s',
    },
    [`& .${muiTableBodyClasses.rowHighlight}`]: {
        '&:hover': {
            backgroundColor: `${theme.palette.action.hover} !important`,
        },
    },
    [`& .${muiTableBodyClasses.rowClickable}`]: {
        cursor: 'pointer',
    },
    [`& .${muiTableBodyClasses.rowAlternativeColor}`]: {
        backgroundColor: alpha(theme.palette.action.hover, 0.02),
    },
    [`& .${muiTableBodyClasses.rowDisabled}`]: {
        cursor: 'not-allowed',
        backgroundColor: `${theme.palette.action.disabledBackground} !important`,
        '&:hover': {
            backgroundColor: `${theme.palette.action.disabledBackground} !important`,
        },
    },
    [`& .${muiTableBodyClasses.rowSelected}`]: {
        backgroundColor: `${theme.palette.action.selected} !important`,
        '&:hover': {
            backgroundColor: `${theme.palette.action.selected} !important`,
        },
    },
    [`& .${muiTableBodyClasses.rowExpanded}`]: {
        cursor: 'default',
    },
    [`& .${muiTableBodyClasses.cellExpandButton}`]: {
        width: 1,
    },
    [`& .${muiTableBodyClasses.cellRowActions}`]: {
        right: 0,
        width: 1,
        position: 'sticky',
        backgroundColor: `${theme.palette.background.default}`,
    },
    [`& .${muiTableBodyClasses.cellSelectionControl}`]: {
        width: 1,
    },
    [`& .${muiTableBodyClasses.cellNoWrap}`]: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        unicodeBidi: 'plaintext',
    },
    [`& .${muiTableBodyClasses.message}`]: {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
    },
    [`& .${muiTableBodyClasses.overlay}`]: {
        top: 0,
        left: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: theme.zIndex.modal,
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        background: theme.palette.action.disabledBackground,
    },
    [`& .${muiTableBodyClasses.overlayContent}`]: {
        position: 'sticky',
        display: 'flex',
        left: 0,
        right: 0,
        padding: 0,
        border: 'none',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

interface TableBodyProps<T>
    extends Pick<
            TableProps<T>,
            | 'onRowSelect'
            | 'onRowExpand'
            | 'onRowClick'
            | 'onRowStatus'
            | 'onCellClick'
            | 'onCellStatus'
            | 'onNoDataMessage'
            | 'onErrorMessage'
        >,
        Pick<TableComponents<T>, 'rowActions' | 'rowExpand'> {
    className?: string;
    columns: SetRequired<TableColumn<T>, 'getValue'>[];
    data: readonly TableRow<T>[];
    displayData: readonly TableRow<T>[];
    options: Required<TableOptions>;
    icons?: TableIcons;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    rowCount?: number;
    selectedRowIds: TableRowId[];
    expandedRowIds: TableRowId[];
    searchMatchers?: SearchMatchers | null;
    translations?: TableTranslations;
    tableContainerRef: React.RefObject<HTMLDivElement | null>;
    onToggleRowSelection: (rowId: TableRowId) => void;
    onToggleRowExpansion: (rowId: TableRowId) => void;
}

const MuiTableBody = <T = any,>({
    className,
    columns,
    data,
    displayData,
    searchMatchers,
    options,
    icons,
    isLoading,
    isFetching,
    isError,
    selectedRowIds,
    expandedRowIds,
    rowActions,
    rowExpand: RowExpandComponent,
    translations,
    onRowStatus,
    onRowClick,
    onRowExpand,
    onRowSelect,
    onCellClick,
    onCellStatus,
    onToggleRowExpansion,
    onToggleRowSelection,
    onNoDataMessage,
    onErrorMessage,
    tableContainerRef,
}: TableBodyProps<T>) => {
    const theme = useTheme();
    const {
        noWrap,
        selectable,
        expandable,
        multiSelect,
        highlightRow,
        alternativeRowColor,
        showHeader,
        skeletonRows,
        loader,
    } = options;

    const isNoData = !isLoading && !isFetching && !isError && !displayData.length;
    const shouldShowSkeleton = (isLoading || isFetching) && loader === 'skeleton';
    const shouldShowOverlay =
        loader === 'dynamic'
            ? !isLoading && (isFetching || isError || isNoData)
            : loader === 'overlay'
              ? isLoading || isFetching || isError || isNoData
              : isError || isNoData;
    const hasRowActions = isArray(rowActions) ? rowActions.length > 0 : !!rowActions;
    const totalColumns = columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0) + (hasRowActions ? 1 : 0);
    const [tableContainerMeasure, tableContainerMeasureRef] = useMeasure(true);

    useEffect(() => {
        tableContainerMeasureRef.current = tableContainerRef.current;
    }, [tableContainerRef]);

    const handleRowSelect = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        onToggleRowSelection(rowId);
        onRowSelect?.(rowId, rowData, rowIndex, !selectedRowIds.includes(rowId));
    };

    const handleRowExpand = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        onToggleRowExpansion(rowId);
        onRowExpand?.(rowId, rowData, rowIndex, !expandedRowIds.includes(rowId));
    };

    const handleRowClick = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        if (onRowClick) {
            onRowClick(rowId, rowData, rowIndex);
        } else if (expandable) {
            handleRowExpand(rowId, rowData, rowIndex);
        } else if (selectable) {
            handleRowSelect(rowId, rowData, rowIndex);
        }
    };

    const skeleton = <Skeleton animation="wave" variant="text" sx={{ mt: 0.5, mb: 0.5 }} />;

    return (
        <Root className={clsx(className, muiTableBodyClasses.root)}>
            {shouldShowOverlay && (
                <MuiTableRow
                    className={muiTableBodyClasses.overlay}
                    style={{
                        backgroundColor: isFetching ? undefined : 'inherit',
                    }}
                >
                    <TableCell
                        className={muiTableBodyClasses.overlayContent}
                        style={{ width: tableContainerMeasure?.width }}
                    >
                        {isFetching && <CircularProgress size="2rem" />}
                        {isError && (onErrorMessage?.(data) || <Typography>Error loading data</Typography>)}
                        {isNoData && (onNoDataMessage?.(data) || <Typography>No data</Typography>)}
                    </TableCell>
                </MuiTableRow>
            )}

            {(!displayData.length && (
                <>
                    <MuiTableRow style={{ height: theme.spacing(10) }}>
                        {isLoading &&
                            Array.from(Array(totalColumns), (_, index) => (
                                <TableCell key={index} size="medium">
                                    {Array.from(Array(skeletonRows), (_, index) => (
                                        <React.Fragment key={index}>{skeleton}</React.Fragment>
                                    ))}
                                </TableCell>
                            ))}
                    </MuiTableRow>
                </>
            )) ||
                displayData.map((row, rowIndex) => {
                    const {
                        style,
                        tooltip,
                        disabled,
                        className,
                        highlighted,
                        selected = selectedRowIds.includes(row.id),
                        expanded = expandedRowIds.includes(row.id),
                    } = onRowStatus?.(row.id, row.data, rowIndex) || {};

                    const isEvenRow = rowIndex % 2 === 0;
                    const rowClasses = clsx(
                        muiTableBodyClasses.row,
                        {
                            [muiTableBodyClasses.rowHighlight]: highlightRow,
                            [muiTableBodyClasses.rowClickable]:
                                !shouldShowSkeleton && (!!onRowClick || selectable || expandable),
                            [muiTableBodyClasses.rowAlternativeColor]: alternativeRowColor
                                ? showHeader
                                    ? isEvenRow
                                    : !isEvenRow
                                : false,
                            [muiTableBodyClasses.rowSelected]: !shouldShowSkeleton && (selected || highlighted),
                            [muiTableBodyClasses.rowDisabled]: disabled,
                        },
                        className,
                    );

                    const cellClasses = clsx(muiTableBodyClasses.cell);

                    const actions = isFunction(rowActions) ? rowActions?.(row.id, row.data, rowIndex) : rowActions;

                    const rowJsx = (
                        <>
                            <MuiTableRow
                                data-row-id={row.id}
                                style={style}
                                className={rowClasses}
                                selected={selected}
                                onClick={(event: any) => {
                                    if (disabled || shouldShowSkeleton) {
                                        return;
                                    }

                                    event.stopPropagation();
                                    handleRowClick(row.id, row.data, rowIndex);
                                }}
                            >
                                {expandable && (
                                    <TableCell className={clsx(cellClasses, muiTableBodyClasses.cellExpandButton)}>
                                        {shouldShowSkeleton ? (
                                            skeleton
                                        ) : (
                                            <Tooltip
                                                title={
                                                    expanded
                                                        ? (translations?.collapse ?? 'Collapse')
                                                        : (translations?.expand ?? 'Expand')
                                                }
                                            >
                                                <IconButton
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleRowExpand(row.id, row.data, rowIndex);
                                                    }}
                                                >
                                                    {expanded
                                                        ? icons?.rowCollapse || <ExpandLess />
                                                        : icons?.rowExpand || <ExpandMore />}
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                )}

                                {selectable && (
                                    <TableCell className={clsx(cellClasses, muiTableBodyClasses.cellSelectionControl)}>
                                        {shouldShowSkeleton ? (
                                            skeleton
                                        ) : multiSelect ? (
                                            <Checkbox
                                                checked={selected}
                                                disabled={disabled}
                                                onChange={(event) => {
                                                    event.stopPropagation();
                                                    handleRowSelect(row.id, row.data, rowIndex);
                                                }}
                                            />
                                        ) : (
                                            <Radio
                                                checked={selected}
                                                disabled={disabled}
                                                onChange={(event) => {
                                                    event.stopPropagation();
                                                    handleRowSelect(row.id, row.data, rowIndex);
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                )}

                                {columns.map((column, cellIndex) => {
                                    const value = column.getValue(row.data);
                                    const searchMatcher = searchMatchers?.[row.id]?.[column.id] || null;
                                    const formatter = column.formatter;
                                    const formatterProps: FormatterProps<T> = {
                                        value,
                                        matcher: searchMatcher,
                                        selected,
                                        expanded,
                                        item: row.data,
                                    };

                                    let formattedValue: React.ReactNode = '';

                                    if (formatter) {
                                        const FormatterComponent = isFunction(formatter) ? formatter : formatter.format;
                                        formattedValue = <FormatterComponent {...formatterProps} />;
                                    }

                                    if (shouldShowSkeleton) {
                                        formattedValue = skeleton;
                                    }

                                    const { style, className } =
                                        onCellStatus?.(row.id, column.id, row.data, rowIndex, cellIndex) || {};

                                    return (
                                        <TableCell
                                            key={column.id}
                                            className={clsx(
                                                cellClasses,
                                                {
                                                    [muiTableBodyClasses.cellNoWrap]: noWrap,
                                                },
                                                className,
                                            )}
                                            align={column.align}
                                            onClick={() => {
                                                onCellClick?.(row.id, column.id, row.data, rowIndex, cellIndex);
                                            }}
                                            style={{
                                                ...style,
                                                ...column.bodyStyle,
                                            }}
                                        >
                                            {formattedValue}
                                        </TableCell>
                                    );
                                })}

                                {((isArray(actions) && actions.length > 0) || actions) && (
                                    <TableCell
                                        align="right"
                                        className={clsx(
                                            cellClasses,
                                            muiTableBodyClasses.cellRowActions,
                                            muiTableBodyClasses.cellNoWrap,
                                        )}
                                    >
                                        {shouldShowSkeleton
                                            ? skeleton
                                            : isArray(actions)
                                              ? actions.map(
                                                    (
                                                        {
                                                            name,
                                                            icon,
                                                            button,
                                                            callback,
                                                            disabled,
                                                            className,
                                                        }: TableAction,
                                                        index: number,
                                                    ) => {
                                                        if (button) {
                                                            return (
                                                                <React.Fragment key={index}>{button}</React.Fragment>
                                                            );
                                                        }

                                                        return (
                                                            <Tooltip key={index} title={name}>
                                                                <IconButton
                                                                    className={className}
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        callback(event);
                                                                    }}
                                                                    disabled={disabled}
                                                                >
                                                                    {isString(icon) ? <Icon className={icon} /> : icon}
                                                                </IconButton>
                                                            </Tooltip>
                                                        );
                                                    },
                                                )
                                              : actions}
                                    </TableCell>
                                )}
                            </MuiTableRow>

                            {expanded && !shouldShowSkeleton && RowExpandComponent && (
                                <MuiTableRow
                                    className={clsx(
                                        rowClasses,
                                        muiTableBodyClasses.rowExpanded,
                                        muiTableBodyClasses.cellNoWrap,
                                    )}
                                >
                                    <TableCell colSpan={totalColumns}>
                                        <RowExpandComponent id={row.id} data={row.data} index={rowIndex} />
                                    </TableCell>
                                </MuiTableRow>
                            )}
                        </>
                    );

                    if (tooltip) {
                        return (
                            <Tooltip title={tooltip} key={row.id}>
                                {rowJsx}
                            </Tooltip>
                        );
                    }

                    return <React.Fragment key={row.id}>{rowJsx}</React.Fragment>;
                })}
        </Root>
    );
};

export const muiTableBodyClasses = generateNamesObject(
    [
        'root',
        'row',
        'rowHighlight',
        'rowAlternativeColor',
        'rowClickable',
        'rowDisabled',
        'rowSelected',
        'rowExpanded',
        'cell',
        'cellExpandButton',
        'cellRowActions',
        'cellNoWrap',
        'cellSelectionControl',
        'message',
        'overlay',
        'overlayContent',
    ],
    MuiTableBody.name,
);

export { MuiTableBody as TableBody };
