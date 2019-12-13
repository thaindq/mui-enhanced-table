import { SortDirection, TableHead, TableRow, TableSortLabel, Theme, withStyles } from '@material-ui/core';
import { createStyles, WithStyles } from '@material-ui/styles';
import cx from 'classnames';
import React from 'react';
import { HeaderCell } from './TableCell';
import TableCheckbox from './TableCheckbox';
import { TableColumn, TableOptions, TableColumnId } from '../../types';


const styles = (theme: Theme) => createStyles({
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
});

interface Props {
    className?: string;
    columns: TableColumn[];
    options: TableOptions;
    selectionCount?: number;
    rowCount?: number;
    onToggleSelectAll: (select?: boolean) => void;
    onSortData: (columnId: TableColumnId, direction?: SortDirection) => void;
}

class EnhancedTableHead extends React.Component<Props & WithStyles<typeof styles>> {
    render() {
        const {
            classes,
            className,
            columns,
            options,
            selectionCount,
            rowCount,
            onToggleSelectAll,
            onSortData,
        } = this.props;

        const {
            sortable,
            selectable,
            expandable,
            multiSelect,
            sortBy,
            sortDirection,
            onRowActions,
        } = options;

        return (
            <TableHead className={cx(className, classes.root)}>
                <TableRow className={classes.row}>
                    {expandable && <HeaderCell className={classes.cell}/>}
                    {selectable &&
                        <HeaderCell className={classes.cell}>
                            {multiSelect && !!selectionCount && !!rowCount &&
                                <TableCheckbox
                                    indeterminate={selectionCount > 0 && selectionCount < rowCount}
                                    checked={selectionCount > 0 && selectionCount === rowCount}
                                    onClick={() => onToggleSelectAll()} />
                            }
                        </HeaderCell>
                    }

                    {columns.map((column) => (
                        <HeaderCell
                            key={column.id}
                            style={column.headStyle}
                            className={classes.cell}
                            align={column.align}
                            sortDirection={sortable && column.sortable && sortBy === column.id ? sortDirection : false}>

                            {column.sortable &&
                                <TableSortLabel
                                    active={sortable && sortBy === column.id}
                                    direction={sortDirection !== false ? sortDirection : undefined}
                                    onClick={!sortable ? undefined : () => onSortData(column.id)}>

                                    {column.name}
                                </TableSortLabel>
                            || column.name }
                        </HeaderCell>
                    ))}

                    {onRowActions && <HeaderCell className={classes.cell} style={{ padding: 0 }}/>}
                </TableRow>
            </TableHead>
        );
    }
}

export default withStyles(styles, { name: "MuiTableHead" })(EnhancedTableHead);
