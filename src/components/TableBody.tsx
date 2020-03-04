import { Checkbox, CircularProgress, createStyles, Icon, IconButton, Radio, TableBody, TableCell, TableRow, Theme, Tooltip, Typography, withStyles } from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import { WithStyles } from '@material-ui/styles';
import cx from 'classnames';
import _ from 'lodash';
import React from 'react';
import { FormatterProps, SearchMatchers, TableAction, TableColumn, TableComponents, TableOptions, TableProps, TableRow as MuiTableRow, TableRowId, TableStatus } from '../../types';

const styles = (theme: Theme) => createStyles({
    root: {        
        position: 'relative'
    },
    row: {
        transition: 'all ease .2s',
        '&:nth-of-type(even)': {
            backgroundColor: theme.palette.background.default,
        },
    },    
    rowNoHeaders: {
        '&:nth-of-type(even)': {
            backgroundColor: 'inherit',
        },
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
        },
    },
    rowNoAlternativeColor: {
        '&:nth-of-type(even)': {
            backgroundColor: 'inherit',
        },
        '&:nth-of-type(odd)': {
            backgroundColor: 'inherit',
        },
    },    
    rowClickable: {
        cursor: 'pointer'
    },
    rowMessage: {
        height: 64
    },
    cell: {        
    },    
    cellEmpty: {
        textAlign: 'center',
        fontSize: '1rem',
    },
    cellHighlighted: {
        backgroundColor: theme.palette.action.selected
    },
    cellDisabled: {
        cursor: 'not-allowed',
        color: theme.palette.text.disabled,
        // backgroundColor: `${chroma(theme.palette.common.red).alpha(0.1)}`,
    },    
    cellExpanded: {
        padding: 8,
        paddingLeft: 48,
    },
    cellExpandButton: {
        width: 20, 
        paddingRight: 0,
        '& > button': {
            width: 20,
            height: 20,
            fontSize: '16px'
        }
    },
    cellRowActions: {
        right: 0,
        width: 1,
        position: 'sticky',
        backgroundColor: theme.palette.background.paper,
        '& > *': {
            display: 'inline-block'
        }
    },
    cellNoWrap: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    cellLastRow: {
        borderBottom: 'none'
    },
    cellSelectionControl: {
        paddingTop: 0,
        paddingBottom: 0
    },
    messageWrapper: {
        position: 'relative',
        height: 64,
    },
    message: {
        top: 0,
        left: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export type TableBodyClassKey = keyof ReturnType<typeof styles>;

interface TableBodyProps<T> extends 
    Pick<TableProps<T>, 'onRowSelect' | 'onRowExpand' | 'onRowClick' | 'onRowStatus' | 'onCellClick' | 'onCellStatus'>, 
    Pick<TableComponents<T>, 'rowActions' | 'rowExpand'> 
{
    className?: string;
    columns: TableColumn<T>[];
    data: MuiTableRow<T>[];
    options: TableOptions<T>;
    status?: TableStatus;
    rowCount?: number;
    rowSelections: TableRowId[];
    rowExpansions: TableRowId[];
    searchMatchers?: SearchMatchers | null;
    onToggleRowSelection: (rowId: TableRowId) => void;    
}

class MuiTableBody<T = any> extends React.Component<TableBodyProps<T> & WithStyles<typeof styles, true>> {

    handleRowSelect = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const {
            rowSelections,
            onRowSelect,
            onToggleRowSelection,
        } = this.props;

        onToggleRowSelection(rowId);
        onRowSelect && onRowSelect(rowId, rowData, rowIndex, !rowSelections.includes(rowId));
    };

    handleRowExpand = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const {
            rowExpansions,
            onRowExpand,
        } = this.props;

        onRowExpand?.(rowId, rowData, rowIndex, !rowExpansions.includes(rowId));
    };

    handleRowClick = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const {
            options,
            onRowClick,
        } = this.props;

        const {
            expandable,
            selectable,
        } = options;

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
                    disabled={disabled}>

                    {_.isString(icon) ? <Icon className={icon} /> : icon}
                </IconButton>
            </Tooltip>
        );
    }

    render() {
        const { 
            classes,
            theme,
            className,
            columns,
            data,
            searchMatchers,
            rowCount,
            options,
            status,
            rowSelections,
            rowExpansions,            
            rowActions,
            rowExpand: RowExpandComponent,
            onRowStatus,
            onRowSelect,
            onRowExpand, 
            onRowClick,
            onCellClick,
            onCellStatus,
        } = this.props;

        const {
            noWrap,
            selectable,
            expandable,
            multiSelect,
            highlightRow,
            alternativeRowColor,            
            showHeader,
        } = options;

        const emptyRows = data.length === 0 ? 1 : ((rowCount || 0) - data.length);
        const colSpan = columns.length + (selectable ? 1 : 0);
        const isLoading = status === 'Pending';
        const hasError = status === 'Error';
        const shouldShowLoading = isLoading && !data.length;
        const shouldShowError = hasError && !data.length;
        const shouldShowNoData = !isLoading && !hasError && !data.length;
        const hasMessage = shouldShowLoading || shouldShowError || shouldShowNoData;

        return (
            <TableBody className={cx(className, classes.root)}>
                {hasMessage && (
                    <TableRow>
                        <TableCell colSpan={1000}>
                            <div className={classes.messageWrapper}>
                                <div className={classes.message}>
                                    {shouldShowLoading && <CircularProgress size={40}/>}
                                    {shouldShowError && <Typography>Error loading data</Typography>}
                                    {shouldShowNoData && <Typography>No data</Typography>}
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                ) || data.map((row, rowIndex) => {
                    const {
                        style,
                        tooltip,
                        disabled,
                        className,
                        highlighted,                        
                        selected = rowSelections.includes(row.id),
                        expanded = rowExpansions.includes(row.id),
                    } = onRowStatus && onRowStatus(row.id, row.data, rowIndex) || {};

                    const rowClassName = cx(classes.row, {
                        [classes.rowNoHeaders]: showHeader,
                        [classes.rowClickable]: !!onRowClick || selectable || expandable,
                        [classes.rowNoAlternativeColor]: !alternativeRowColor,
                    }, className);

                    const cellClassName = cx(classes.cell, {
                        [classes.cellDisabled]: disabled,
                        [classes.cellHighlighted]: selected || highlighted,
                        [classes.cellLastRow]: rowIndex === data.length - 1,
                    });

                    const actions = _.isFunction(rowActions) ? rowActions?.(row.id, row.data, rowIndex) : rowActions;

                    const rowJsx = (
                        <>
                            <TableRow
                                style={style}
                                className={rowClassName}
                                selected={selected}
                                hover={highlightRow}
                                onClick={(event) => +event.stopPropagation() || disabled || this.handleRowClick(row.id, row.data, rowIndex)}>

                                {expandable &&
                                    <TableCell className={cx(cellClassName, classes.cellExpandButton)}>
                                        <IconButton onClick={(event) => +event.stopPropagation() || this.handleRowExpand(row.id, row.data, rowIndex)}>
                                            {expanded && 
                                                <ExpandLess fontSize="inherit" style={{ position: 'absolute' }}/>
                                            ||
                                                <ExpandMore fontSize="inherit" style={{ position: 'absolute' }}/>
                                            }
                                        </IconButton>
                                    </TableCell>
                                }

                                {selectable &&
                                    <TableCell className={cx(cellClassName, classes.cellSelectionControl)}>
                                        {multiSelect &&
                                            <Checkbox
                                                checked={selected}
                                                disabled={disabled}
                                                onClick={(event) => +event.stopPropagation() || this.handleRowSelect(row.id, row.data, rowIndex)} />
                                        ||
                                            <Radio
                                                checked={selected}
                                                disabled={disabled}
                                                onClick={(event) => +event.stopPropagation() || this.handleRowSelect(row.id, row.data, rowIndex)} />
                                        }                                    
                                    </TableCell>
                                }

                                {columns.map((column, cellIndex) => {
                                    let value = _.get(row.data, column.id);
                                    
                                    if (value === undefined) {
                                        value = column.defaultValue;
                                    }

                                    const searchMatcher = searchMatchers && searchMatchers[row.id] && searchMatchers[row.id][column.id] || null;
                                    const formatter = column.formatter;

                                    const formatterProps: FormatterProps<T> = {
                                        value,
                                        matcher: searchMatcher,
                                        theme,
                                        selected,
                                        expanded,
                                        item: row.data
                                    };

                                    const formattedValue = formatter                                        
                                        ? _.isFunction(formatter)
                                            ? formatter(formatterProps)
                                            : formatter.format(formatterProps)
                                        : '';

                                    const { 
                                        style,
                                        className,
                                    } = onCellStatus && onCellStatus(row.id, column.id, row.data, rowIndex, cellIndex) || {};

                                    return (
                                        <TableCell
                                            key={column.id}                                        
                                            className={cx(cellClassName, className, {
                                                [classes.cellNoWrap]: noWrap
                                            })}
                                            align={column.align}
                                            onClick={() => onCellClick && +onCellClick(row.id, column.id, row.data, rowIndex, cellIndex) || undefined}
                                            style={{
                                                ...style,
                                                ...column.bodyStyle
                                            }}>
                                            
                                            {formattedValue}
                                        </TableCell>
                                    );
                                })}

                                {actions &&
                                    <TableCell align="right" className={cx(cellClassName, classes.cellRowActions, classes.cellNoWrap)} >                                            
                                        {_.isArray(actions) ? actions.map(this.renderAction) : actions}
                                    </TableCell>
                                }
                            </TableRow>

                            {expanded && RowExpandComponent &&
                                <TableRow>
                                    <TableCell colSpan={100} className={classes.cellExpanded}>
                                        <RowExpandComponent 
                                            id={row.id}
                                            data={row.data}
                                            index={rowIndex}/>
                                    </TableCell>
                                </TableRow>
                            }
                        </>
                    );

                    if (tooltip) {
                        return (
                            <Tooltip title={tooltip} key={row.id}>
                                {rowJsx}
                            </Tooltip>
                        );
                    }

                    return (
                        <React.Fragment key={row.id}>
                            {rowJsx}
                        </React.Fragment>
                    );
                })}
            </TableBody>
        );
    }
}

// export default withStyles(styles, { name: 'MuiTableBody', withTheme: true })(MuiTableBody);

// https://stackoverflow.com/a/52573647
export default class<T = any> extends React.Component<TableBodyProps<T> & { classes?: { [key in keyof typeof styles]?: string } }> {
    private readonly Component = withStyles(styles, { name: 'MuiEnhancedTableBody', withTheme: true })(
        (props: JSX.LibraryManagedAttributes<typeof MuiTableBody, MuiTableBody<T>["props"]>) => <MuiTableBody<T> {...props} />
    );

    render() {
        return <this.Component {...this.props} />;
    }
}