import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
    Checkbox,
    CircularProgress,
    Icon,
    IconButton,
    Radio,
    styled,
    TableBody,
    TableCell,
    TableRow as MuiTableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import cx from 'classnames';
import { get, isArray, isFunction, isString } from 'lodash';
import React from 'react';
import {
    FormatterProps,
    SearchMatchers,
    TableAction,
    TableColumn,
    TableComponents,
    TableOptions,
    TableProps,
    TableRow,
    TableRowId,
    TableStatus,
} from '../types';
import { generateNamesObject } from '../utils';

export const muiTableBodyClasses = generateNamesObject(
    [
        'root',
        'row',
        'rowNoHeader',
        'rowNoAlternativeColor',
        'rowClickable',
        'rowMessage',
        'cell',
        'cellEmpty',
        'cellHighlighted',
        'cellDisabled',
        'cellExpanded',
        'cellExpandButton',
        'cellRowActions',
        'cellNoWrap',
        'cellLastRow',
        'cellSelectionControl',
        'messageWrapper',
        'message',
    ],
    'MuiTableBody',
);

const Root = styled(TableBody)(({ theme }) => ({
    position: 'relative',
    [`& .${muiTableBodyClasses.row}`]: {
        transition: 'all ease .2s',
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
        },
    },
    [`& .${muiTableBodyClasses.rowNoHeader}`]: {
        '&:nth-of-type(odd)': {
            backgroundColor: 'inherit',
        },
        '&:nth-of-type(even)': {
            backgroundColor: theme.palette.background.default,
        },
    },
    [`& .${muiTableBodyClasses.rowNoAlternativeColor}`]: {
        '&:nth-of-type(even)': {
            backgroundColor: 'inherit',
        },
        '&:nth-of-type(odd)': {
            backgroundColor: 'inherit',
        },
    },
    [`& .${muiTableBodyClasses.rowClickable}`]: {
        cursor: 'pointer',
    },
    [`& .${muiTableBodyClasses.rowMessage}`]: {
        height: 64,
    },
    [`& .${muiTableBodyClasses.cell}`]: {},
    [`& .${muiTableBodyClasses.cellEmpty}`]: {
        textAlign: 'center',
        fontSize: '1rem',
    },
    [`& .${muiTableBodyClasses.cellHighlighted}`]: {
        backgroundColor: theme.palette.action.selected,
    },
    [`& .${muiTableBodyClasses.cellDisabled}`]: {
        cursor: 'not-allowed',
        color: theme.palette.text.disabled,
        // backgroundColor: `${chroma(theme.palette.common.red).alpha(0.1)}`,
    },
    [`& .${muiTableBodyClasses.cellExpanded}`]: {
        padding: 8,
        paddingLeft: 48,
    },
    [`& .${muiTableBodyClasses.cellExpandButton}`]: {
        width: 20,
        paddingRight: 0,
        '& > button': {
            width: 20,
            height: 20,
            fontSize: '16px',
        },
    },
    [`& .${muiTableBodyClasses.cellRowActions}`]: {
        right: 0,
        width: 1,
        position: 'sticky',
        backgroundColor: theme.palette.background.default,
        '& > *': {
            display: 'inline-block',
        },
    },
    [`& .${muiTableBodyClasses.cellNoWrap}`]: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    [`& .${muiTableBodyClasses.cellLastRow}`]: {
        borderBottom: 'none',
    },
    [`& .${muiTableBodyClasses.cellSelectionControl}`]: {
        width: 1,
        paddingTop: 0,
        paddingBottom: 0,
    },
    [`& .${muiTableBodyClasses.messageWrapper}`]: {
        position: 'relative',
        height: 64,
    },
    [`& .${muiTableBodyClasses.message}`]: {
        top: 0,
        left: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
    columns: TableColumn<T>[];
    data: readonly TableRow<T>[];
    displayData: readonly TableRow<T>[];
    options: TableOptions;
    status?: TableStatus;
    rowCount?: number;
    rowSelections: TableRowId[];
    rowExpansions: TableRowId[];
    searchMatchers?: SearchMatchers | null;
    onToggleRowSelection: (rowId: TableRowId) => void;
    onToggleRowExpansion: (rowId: TableRowId) => void;
}

class MuiTableBody<T = any> extends React.Component<TableBodyProps<T>> {
    handleRowSelect = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const { rowSelections, onRowSelect, onToggleRowSelection } = this.props;

        onToggleRowSelection(rowId);
        onRowSelect && onRowSelect(rowId, rowData, rowIndex, !rowSelections.includes(rowId));
    };

    handleRowExpand = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const { rowExpansions, onRowExpand, onToggleRowExpansion } = this.props;

        onToggleRowExpansion(rowId);
        onRowExpand?.(rowId, rowData, rowIndex, !rowExpansions.includes(rowId));
    };

    handleRowClick = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const { options, onRowClick } = this.props;

        const { expandable, selectable } = options;

        if (onRowClick) {
            onRowClick(rowId, rowData, rowIndex);
        } else if (expandable) {
            this.handleRowExpand(rowId, rowData, rowIndex);
        } else if (selectable) {
            this.handleRowSelect(rowId, rowData, rowIndex);
        }
    };

    renderAction = ({ name, icon, button, callback, disabled, className }: TableAction, index: number) => {
        if (button) {
            return <React.Fragment key={index}>{button}</React.Fragment>;
        }

        return (
            <Tooltip key={index} title={name}>
                <IconButton
                    size="small"
                    className={className}
                    onClick={(event) => +event.stopPropagation() || callback(event)}
                    disabled={disabled}
                >
                    {isString(icon) ? <Icon className={icon} /> : icon}
                </IconButton>
            </Tooltip>
        );
    };

    render() {
        const {
            className,
            columns,
            data,
            displayData,
            searchMatchers,
            options,
            status,
            rowSelections,
            rowExpansions,
            rowActions,
            rowExpand: RowExpandComponent,
            onRowStatus,
            onRowClick,
            onCellClick,
            onCellStatus,
            onNoDataMessage,
            onErrorMessage,
        } = this.props;

        const {
            noWrap,
            selectable,
            expandable,
            multiSelect,
            highlightRow,
            alternativeRowColor,
            showHeader,
            respectDataStatus,
            stickyHeader,
            component,
        } = options;

        // const emptyRows = displayData.length === 0 ? 1 : (rowCount || 0) - displayData.length;
        // const colSpan = columns.length + (selectable ? 1 : 0);
        const isLoading = status === 'pending';
        const hasError = status === 'rejected';
        const shouldShowLoading = isLoading && (respectDataStatus || !displayData.length);
        const shouldShowError = hasError && (respectDataStatus || !displayData.length);
        const shouldShowNoData = !isLoading && !hasError && !displayData.length;
        const hasMessage = shouldShowLoading || shouldShowError || shouldShowNoData;

        return (
            <Root
                // @ts-ignore: fix this
                component={component || 'tbody'}
                className={cx(className, muiTableBodyClasses.root)}
                sx={{
                    display: hasMessage ? undefined : 'table-footer-group',
                }}
            >
                {(hasMessage && (
                    <MuiTableRow component={component || 'tr'}>
                        <TableCell colSpan={1000} component={component}>
                            <div className={muiTableBodyClasses.messageWrapper}>
                                <div className={muiTableBodyClasses.message}>
                                    {shouldShowLoading && <CircularProgress size={40} />}
                                    {shouldShowError &&
                                        (onErrorMessage?.(data) || <Typography>Error loading data</Typography>)}
                                    {shouldShowNoData && (onNoDataMessage?.(data) || <Typography>No data</Typography>)}
                                </div>
                            </div>
                        </TableCell>
                    </MuiTableRow>
                )) ||
                    displayData.map((row, rowIndex) => {
                        const {
                            style,
                            tooltip,
                            disabled,
                            className,
                            highlighted,
                            selected = rowSelections.includes(row.id),
                            expanded = rowExpansions.includes(row.id),
                        } = (onRowStatus && onRowStatus(row.id, row.data, rowIndex)) || {};

                        const rowClassName = cx(
                            muiTableBodyClasses.row,
                            {
                                [muiTableBodyClasses.rowNoHeader]: !showHeader || stickyHeader,
                                [muiTableBodyClasses.rowClickable]: !!onRowClick || selectable || expandable,
                                [muiTableBodyClasses.rowNoAlternativeColor]: !alternativeRowColor,
                            },
                            className,
                        );

                        const cellClassName = cx(muiTableBodyClasses.cell, {
                            [muiTableBodyClasses.cellDisabled]: disabled,
                            [muiTableBodyClasses.cellHighlighted]: selected || highlighted,
                            [muiTableBodyClasses.cellLastRow]: rowIndex === displayData.length - 1,
                        });

                        const actions = isFunction(rowActions) ? rowActions?.(row.id, row.data, rowIndex) : rowActions;

                        const rowJsx = (
                            <>
                                <MuiTableRow
                                    data-row-id={row.id}
                                    sx={style}
                                    className={rowClassName}
                                    selected={selected}
                                    hover={highlightRow}
                                    component={component || 'tr'}
                                    onClick={(event: any) => {
                                        +event.stopPropagation() ||
                                            disabled ||
                                            this.handleRowClick(row.id, row.data, rowIndex);
                                    }}
                                >
                                    {expandable && (
                                        <TableCell
                                            className={cx(cellClassName, muiTableBodyClasses.cellExpandButton)}
                                            component={component}
                                        >
                                            <IconButton
                                                onClick={(event) =>
                                                    +event.stopPropagation() ||
                                                    this.handleRowExpand(row.id, row.data, rowIndex)
                                                }
                                            >
                                                {(expanded && (
                                                    <ExpandLess fontSize="inherit" sx={{ position: 'absolute' }} />
                                                )) || <ExpandMore fontSize="inherit" sx={{ position: 'absolute' }} />}
                                            </IconButton>
                                        </TableCell>
                                    )}

                                    {selectable && (
                                        <TableCell
                                            className={cx(cellClassName, muiTableBodyClasses.cellSelectionControl)}
                                            component={component}
                                        >
                                            {(multiSelect && (
                                                <Checkbox
                                                    checked={selected}
                                                    disabled={disabled}
                                                    onChange={(event) =>
                                                        +event.stopPropagation() ||
                                                        this.handleRowSelect(row.id, row.data, rowIndex)
                                                    }
                                                />
                                            )) || (
                                                <Radio
                                                    checked={selected}
                                                    disabled={disabled}
                                                    onChange={(event) =>
                                                        +event.stopPropagation() ||
                                                        this.handleRowSelect(row.id, row.data, rowIndex)
                                                    }
                                                />
                                            )}
                                        </TableCell>
                                    )}

                                    {columns.map((column, cellIndex) => {
                                        let value = column.getValue?.(row.data) ?? get(row.data, column.id);

                                        if (value === undefined) {
                                            value = column.defaultValue;
                                        }

                                        const searchMatcher = searchMatchers?.[row.id]?.[column.id] || null;
                                        const formatter = column.formatter;

                                        const formatterProps: FormatterProps<T> = {
                                            value,
                                            matcher: searchMatcher,
                                            selected,
                                            expanded,
                                            item: row.data,
                                        };

                                        const formattedValue = formatter
                                            ? isFunction(formatter)
                                                ? formatter(formatterProps)
                                                : formatter.format(formatterProps)
                                            : '';

                                        const { style, className } =
                                            (onCellStatus &&
                                                onCellStatus(row.id, column.id, row.data, rowIndex, cellIndex)) ||
                                            {};

                                        return (
                                            <TableCell
                                                key={column.id}
                                                className={cx(cellClassName, className, {
                                                    [muiTableBodyClasses.cellNoWrap]: noWrap,
                                                })}
                                                align={column.align}
                                                component={component}
                                                onClick={() =>
                                                    (onCellClick &&
                                                        +onCellClick(
                                                            row.id,
                                                            column.id,
                                                            row.data,
                                                            rowIndex,
                                                            cellIndex,
                                                        )) ||
                                                    undefined
                                                }
                                                sx={{
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
                                            className={cx(
                                                cellClassName,
                                                muiTableBodyClasses.cellRowActions,
                                                muiTableBodyClasses.cellNoWrap,
                                            )}
                                            component={component}
                                        >
                                            {isArray(actions) ? actions.map(this.renderAction) : actions}
                                        </TableCell>
                                    )}
                                </MuiTableRow>

                                {expanded && RowExpandComponent && (
                                    <MuiTableRow component={component || 'tr'}>
                                        <TableCell
                                            colSpan={100}
                                            className={muiTableBodyClasses.cellExpanded}
                                            component={component}
                                        >
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
    }
}

export default MuiTableBody;
