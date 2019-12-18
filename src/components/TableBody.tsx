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
            backgroundColor: 'unset',
        },
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
        },
    },
    rowNoAlternativeColor: {
        '&:nth-of-type(even)': {
            backgroundColor: 'unset',
        },
        '&:nth-of-type(odd)': {
            backgroundColor: 'unset',
        },
    },    
    rowClickable: {
        cursor: 'pointer'
    },
    rowAction: {
        width: 20,
        height: 20,
        fontSize: '16px',
        '& > span': {
            position: 'absolute'
        }
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
        // backgroundColor: `${chroma(theme.palette.common.blue).alpha(0.1)}`
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
    cellNoWrap: {
        whiteSpace: 'nowrap'
    },
    cellLastRow: {
        borderBottom: 'none'
    },    
});

interface Props<T> {
    theme: Theme;
    className?: string;
    columns: TableColumn[];
    data: MuiTableRow<T>[];
    options: TableOptions<T>;
    isLoading?: boolean;
    hasError?: boolean;
    rowCount?: number;
    searchMatchers?: SearchMatchers | null;
}

class EnhancedTableBody<T> extends React.Component<Props<T> & WithStyles<typeof styles>> {

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
                <div style={{ display: 'inline' }} className={className}>
                    <IconButton className={this.props.classes.rowAction} onClick={callback} disabled={disabled}>
                        {!!icon ? icon : <Icon className={className} />}
                    </IconButton>
                </div>
            </Tooltip>
        );
    }

    handleRowSelect = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const {
            selectable,
            onRowSelect,
        } = this.props.options;

        selectable && onRowSelect && onRowSelect(rowId, rowData, rowIndex);
    };

    handleRowExpand = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const {
            expandable,
            onRowExpand,
        } = this.props.options;

        expandable && onRowExpand && onRowExpand(rowId, rowData, rowIndex);
    };

    handleRowClick = (rowId: TableRowId, rowData: T, rowIndex: number) => {
        const {
            expandable,
            selectable,            
            onRowClick,
            onRowExpand,
            onRowSelect,
        } = this.props.options;

        if (onRowClick) {
            onRowClick(rowId, rowData, rowIndex);
        } else if (expandable) {
            onRowExpand && onRowExpand(rowId, rowData, rowIndex);
        } else if (selectable) {
            onRowSelect && onRowSelect(rowId, rowData, rowIndex);
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
        } = this.props;

        const {
            selectable,
            expandable,
            multiSelect,
            highlightRow,
            alternativeRowColor,
            rowSelections = [],
            rowExpansions = [],
            showHeaders,
            onRowActions,
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
                        [classes.rowNoHeaders]: showHeaders,
                        [classes.rowClickable]: !!onRowClick || selectable || expandable,
                        [classes.rowNoAlternativeColor]: !alternativeRowColor,                        
                    }, className);

                    const cellClassName = cx(classes.cell, {
                        [classes.cellDisabled]: disabled,
                        [classes.cellHighlighted]: selected || highlighted,
                        [classes.cellLastRow]: rowIndex === data.length - 1,
                    });

                    const actions = onRowActions && onRowActions(row.id, row.data, rowIndex) || [];

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
                                    <TableCell className={cellClassName}>
                                        {multiSelect &&
                                            <TableCheckbox
                                                checked={selected}
                                                disabled={disabled}
                                                onClick={() => this.handleRowSelect(row.id, row.data, rowIndex)} />
                                        ||
                                            <TableRadio
                                                checked={selected}
                                                disabled={disabled}
                                                onClick={() => this.handleRowSelect(row.id, row.data, rowIndex)} />
                                        }                                    
                                    </TableCell>
                                }

                                {columns.map((column, cellIndex) => {
                                    let value = _.get(row.data, column.id);
                                    
                                    if (value === undefined) {
                                        value = column.defaultValue;
                                    }

                                    // const stringValue = column.formatter.getValueString(value);
                                    const searchMatcher = searchMatchers && searchMatchers[row.id] && searchMatchers[row.id][column.id];

                                    // TODO: add formatter
                                    const formattedValue = value;

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
                                            
                                            <span>{formattedValue}</span>
                                        </TableCell>
                                    );
                                })}

                                {onRowActions &&
                                    <TableCell className={cellClassName} align="right" style={{ padding: !actions.length ? 0 : undefined }}>
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

// export default withStyles(styles, { name: 'MuiTableBody', withTheme: true })(EnhancedTableBody);

// https://stackoverflow.com/a/52573647
export default class WrappedEnhancedTableBody<T> extends React.Component<PropsFor<WrappedEnhancedTableBody<T>["Component"]>, {}> {
    private readonly Component = withStyles(styles, { name: 'MuiTableBody', withTheme: true })(
        (props: JSX.LibraryManagedAttributes<typeof EnhancedTableBody, EnhancedTableBody<T>["props"]>) => <EnhancedTableBody<T> {...props} />
    );

    render() {
        return <this.Component {...this.props} />;
    }
}