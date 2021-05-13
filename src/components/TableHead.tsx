import {
    Checkbox,
    SortDirection,
    TableCell,
    TableHead,
    TableRow,
    TableSortLabel,
    Theme,
    withStyles,
} from '@material-ui/core';
import { createStyles, WithStyles } from '@material-ui/styles';
import cx from 'classnames';
import React from 'react';
import { TableColumn, TableColumnId, TableOptions } from '..';

const styles = (theme: Theme) =>
    createStyles({
        root: {},
        row: {
            height: 48,
        },
        cell: {
            '& > div': {
                flexDirection: 'inherit',
            },
        },
        cellNoWrap: {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        allCaps: {
            textTransform: 'uppercase',
        },
        cellRowActions: {
            right: 0,
            position: 'sticky',
            backgroundColor: theme.palette.background.default,
        },
    });

export type TableHeadClassKey = keyof ReturnType<typeof styles>;

interface TableHeadProps {
    className?: string;
    columns: TableColumn[];
    options: TableOptions;
    selectionCount?: number;
    rowCount?: number;
    sortBy?: TableColumnId;
    sortDirection?: SortDirection;
    hasRowActions?: boolean;
    onToggleSelectAll: () => void;
    onSortData: (columnId: TableColumnId, direction?: SortDirection) => void;
}

class MuiTableHead extends React.Component<TableHeadProps & WithStyles<typeof styles, true>> {
    render() {
        const {
            classes,
            className,
            columns,
            options,
            selectionCount,
            rowCount,
            sortBy,
            sortDirection,
            hasRowActions,
            onToggleSelectAll,
            onSortData,
        } = this.props;

        const { noWrap, sortable, selectable, expandable, allCapsHeader, multiSelect, component } = options;

        return (
            <TableHead className={cx(className, classes.root)} component={component || 'thead'}>
                <TableRow className={classes.row} component={component || 'tr'}>
                    {expandable && <TableCell className={classes.cell} component={component} />}

                    {selectable && (
                        <TableCell className={classes.cell} component={component}>
                            {multiSelect && selectionCount !== undefined && rowCount !== undefined && (
                                <Checkbox
                                    indeterminate={selectionCount > 0 && selectionCount < rowCount}
                                    checked={selectionCount > 0 && selectionCount === rowCount}
                                    onClick={() => onToggleSelectAll()}
                                />
                            )}
                        </TableCell>
                    )}

                    {columns.map((column) => (
                        <TableCell
                            key={column.id}
                            style={column.headStyle}
                            className={cx(classes.cell, {
                                [classes.allCaps]: allCapsHeader,
                                [classes.cellNoWrap]: noWrap,
                            })}
                            align={column.align}
                            component={component}
                            sortDirection={sortable && column.sortable && sortBy === column.id ? sortDirection : false}
                        >
                            {(sortable && column.sortable && (
                                <TableSortLabel
                                    active={sortable && sortBy === column.id && !!sortDirection}
                                    direction={sortDirection !== false ? sortDirection : undefined}
                                    onClick={!sortable ? undefined : () => onSortData(column.id)}
                                >
                                    {column.name}
                                </TableSortLabel>
                            )) ||
                                column.name}
                        </TableCell>
                    ))}

                    {hasRowActions && (
                        <TableCell className={cx(classes.cell, classes.cellRowActions)} component={component} />
                    )}
                </TableRow>
            </TableHead>
        );
    }
}

export default withStyles(styles, { name: 'MuiEnhancedTableHead', withTheme: true })(MuiTableHead);
