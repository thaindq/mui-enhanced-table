import { SortDirection, TableHead, TableRow, TableSortLabel, Theme, withStyles, TableCell, Checkbox } from '@material-ui/core';
import { createStyles, WithStyles } from '@material-ui/styles';
import cx from 'classnames';
import React from 'react';
import { TableColumn, TableOptions, TableColumnId } from '../../types';


const styles = createStyles({
    root: {
    },
    row: {
        height: 48,
    },
    cell: {
        '& > div': {
            flexDirection: 'inherit'
        },
    },
    cellNoWrap: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    allCaps: {
        textTransform: 'uppercase'
    },
    cellRowActions: { 
        right: 0,
        position: 'sticky',
    }
});

interface Props {
    className?: string;
    columns: TableColumn[];
    options: TableOptions;
    selectionCount?: number;
    rowCount?: number;    
    sortBy?: TableColumnId;
    sortDirection?: SortDirection;
    onToggleSelectAll: () => void;
    onSortData: (columnId: TableColumnId, direction?: SortDirection) => void;
}

class MuiTableHead extends React.Component<Props & WithStyles<typeof styles, true>> {
    render() {
        const {
            classes,
            theme,
            className,
            columns,
            options,
            selectionCount,
            rowCount,
            sortBy,
            sortDirection,
            onToggleSelectAll,
            onSortData,
        } = this.props;

        const {
            noWrap,
            sortable,
            selectable,
            expandable,
            allCapsHeader,
            multiSelect,
            rowActions,
        } = options;

        return (
            <TableHead className={cx(className, classes.root)}>
                <TableRow className={classes.row}>
                    {expandable && <TableCell className={classes.cell}/>}

                    {selectable &&
                        <TableCell className={classes.cell}>
                            {multiSelect && selectionCount !== undefined && rowCount !== undefined &&
                                <Checkbox
                                    indeterminate={selectionCount > 0 && selectionCount < rowCount}
                                    checked={selectionCount > 0 && selectionCount === rowCount}
                                    onClick={() => onToggleSelectAll()} />
                            }
                        </TableCell>
                    }

                    {columns.map((column) => (
                        <TableCell
                            key={column.id}
                            style={column.headStyle}
                            className={cx(classes.cell, { 
                                [classes.allCaps]: allCapsHeader,
                                [classes.cellNoWrap]: noWrap,
                            })}
                            align={column.align}
                            sortDirection={sortable && column.sortable && sortBy === column.id ? sortDirection : false}>

                            {sortable && column.sortable &&
                                <TableSortLabel
                                    active={sortable && sortBy === column.id && !!sortDirection}
                                    direction={sortDirection !== false ? sortDirection : undefined}
                                    onClick={!sortable ? undefined : () => onSortData(column.id)}>

                                    {column.name}
                                </TableSortLabel>
                            || column.name }
                        </TableCell>
                    ))}

                    {rowActions && <TableCell className={cx(classes.cell, classes.cellRowActions)} />}
                </TableRow>
            </TableHead>
        );
    }
}

export default withStyles(styles, { name: 'MuiEnhancedTableHead', withTheme: true })(MuiTableHead);
