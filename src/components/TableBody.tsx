import { CircularProgress, createStyles, Icon, IconButton, TableBody, TableRow, Theme, Tooltip, withStyles } from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import { WithStyles } from '@material-ui/styles';
import cx from 'classnames';
import _ from 'lodash';
import React from 'react';
import TableCell from './TableCell';
import TableCheckbox from './TableCheckbox';
import TableRadio from './TableRadio';
import { SearchMatcher, TableAction, TableColumn, TableOptions, TableRowId, TableRow as MuiTableRow, SearchMatchers } from '../../types';
import { PropsFor } from '@material-ui/system';
import BaseFormatter from '../formatters/BaseFormatter';

const styles = (theme: Theme) => createStyles({
    root: {        
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
        backgroundColor: theme.palette.grey[100],
        '& > *': {
            display: 'inline-block'
        }
    },
    cellNoWrap: {
        whiteSpace: 'nowrap'
    },
    cellLastRow: {
        borderBottom: 'none'
    },
    cellSelectionControl: {
        paddingTop: 0,
        paddingBottom: 0
    }
});

interface Props<T> {
    className?: string;
    columns: TableColumn[];
    data: MuiTableRow<T>[];
    options: TableOptions<T>;
    isLoading?: boolean;
    hasError?: boolean;
    rowCount?: number;
    rowSelections: TableRowId[];
    rowExpansions: TableRowId[];
    searchMatchers?: SearchMatchers | null;
    onToggleRowSelection: (rowId: TableRowId) => void;
}

class MuiTableBody<T> extends React.Component<Props<T> & WithStyles<typeof styles, true>> {

    renderRowActions = (actions: TableAction[]) => {
        if (!_.isArray(actions)) {
            throw new Error('rowActions must return an array of action object');
        }

        return actions.map(this.renderAction);
    }

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

    handleRowSelect = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const {
            rowSelections,
            options,
            onToggleRowSelection,
        } = this.props;

        const {
            onRowSelect,
        } = options;

        onToggleRowSelection(rowId);
        onRowSelect && onRowSelect(rowId, rowData, rowIndex, !rowSelections.includes(rowId));
    };

    handleRowExpand = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const {
            rowExpansions,
            options,
        } = this.props;

        const {
            onRowExpand,
        } = options;

        onRowExpand && onRowExpand(rowId, rowData, rowIndex, !rowExpansions.includes(rowId));
    };

    handleRowClick = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const {
            expandable,
            selectable,            
            onRowClick,
        } = this.props.options;

        if (onRowClick) {
            onRowClick(rowId, rowData, rowIndex);
        } else if (expandable) {
            this.handleRowExpand(rowId, rowData, rowIndex);
        } else if (selectable) {
            this.handleRowSelect(rowId, rowData, rowIndex);
        }
    };

    render() {
        const { 
            classes,
            theme,
            className,
            columns,
            data,
            isLoading,
            hasError,            
            searchMatchers,
            rowCount,
            options,
            rowSelections,
            rowExpansions,
        } = this.props;

        const {
            selectable,
            expandable,
            multiSelect,
            highlightRow,
            alternativeRowColor,            
            showHeader,
            rowActions,
            onRowStatus,
            onRowSelect,
            onRowExpand, 
            onRowClick,
            onCellClick,
            onCellStatus,
            RowExpandComponent,
        } = options;

        const emptyRows = data.length === 0 ? 1 : ((rowCount || 0) - data.length);
        const colSpan = columns.length + (selectable ? 1 : 0);
        const shouldShowLoading = isLoading && !data.length;
        const shouldShowError = hasError && !data.length;
        const shouldShowNoData = !isLoading && !hasError && !data.length;
        const hasMessage = shouldShowLoading || shouldShowError || shouldShowNoData;

        return (
            <TableBody className={cx(className, classes.root)}>
                {hasMessage &&
                    <TableRow className={cx(classes.row, classes.rowMessage)}>
                        <TableCell colSpan={colSpan} className={classes.cellEmpty}>
                            {shouldShowLoading && <CircularProgress size={40} />}
                            {shouldShowError && 'Error loading data'}
                            {shouldShowNoData && 'No data'}
                        </TableCell>
                    </TableRow>                   
                
                || data.map((row, rowIndex) => {
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

                    const actions = _.isFunction(rowActions)
                        ? rowActions(row.id, row.data, rowIndex) 
                        : _.isArray(rowActions)
                            ? rowActions
                            : [];

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
                                            <TableCheckbox
                                                checked={selected}
                                                disabled={disabled}
                                                onClick={(event) => +event.stopPropagation() || this.handleRowSelect(row.id, row.data, rowIndex)} />
                                        ||
                                            <TableRadio
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
                                    const formatter = column.formatter || new BaseFormatter();
                                    const formattedValue = _.isFunction(formatter)
                                        ? formatter(value, searchMatcher, theme, selected, expanded, row.data)
                                        : formatter.format(value, searchMatcher, theme, selected, expanded, row.data);

                                    const { 
                                        style,
                                        className,
                                    } = onCellStatus && onCellStatus(row.id, column.id, row.data, rowIndex, cellIndex) || {};

                                    return (
                                        <TableCell
                                            key={column.id}                                        
                                            className={cx(cellClassName, className)}
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

                                {rowActions &&
                                    <TableCell align="right" className={cx(cellClassName, classes.cellRowActions, classes.cellNoWrap)} >                                            
                                        {this.renderRowActions(actions)}
                                    </TableCell>
                                }
                            </TableRow>

                            {expanded && RowExpandComponent &&
                                <TableRow>
                                    <TableCell colSpan={100} className={classes.cellExpanded}>
                                        <RowExpandComponent id={row.id}/>
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
export default class WrappedMuiTableBody<T> extends React.Component<PropsFor<WrappedMuiTableBody<T>["Component"]>, {}> {
    private readonly Component = withStyles(styles, { name: 'MuiTableBody', withTheme: true })(
        (props: JSX.LibraryManagedAttributes<typeof MuiTableBody, MuiTableBody<T>["props"]>) => <MuiTableBody<T> {...props} />
    );

    render() {
        return <this.Component {...this.props} />;
    }
}