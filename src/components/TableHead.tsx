import { Checkbox, SortDirection, styled, TableCell, TableHead, TableRow, TableSortLabel } from '@mui/material';
import cx from 'classnames';
import React from 'react';
import { TableColumn, TableColumnId, TableOptions } from '../types';
import { generateNamesObject } from '../utils';

export const muiTableHeadClasses = generateNamesObject(
    ['root', 'row', 'cell', 'cellNoWrap', 'allCaps', 'cellRowActions'],
    'MuiTableHead',
);

const Root = styled(TableHead)(({ theme }) => ({
    [`& .${muiTableHeadClasses.row}`]: {
        height: 48,
    },
    [`& .${muiTableHeadClasses.cell}`]: {
        '& > div': {
            flexDirection: 'inherit',
        },
    },
    [`& .${muiTableHeadClasses.cellNoWrap}`]: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    [`& .${muiTableHeadClasses.allCaps}`]: {
        textTransform: 'uppercase',
    },
    [`& .${muiTableHeadClasses.cellRowActions}`]: {
        right: 0,
        position: 'sticky',
        backgroundColor: theme.palette.background.default,
    },
}));

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

class MuiTableHead extends React.Component<TableHeadProps> {
    render() {
        const {
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

        const { noWrap, sortable, selectable, expandable, allCapsHeader, multiSelect } = options;

        return (
            <Root className={cx(className, muiTableHeadClasses.root)}>
                <TableRow className={muiTableHeadClasses.row}>
                    {expandable && <TableCell className={muiTableHeadClasses.cell} />}

                    {selectable && (
                        <TableCell className={muiTableHeadClasses.cell}>
                            {multiSelect && selectionCount !== undefined && rowCount !== undefined && (
                                <Checkbox
                                    indeterminate={selectionCount > 0 && selectionCount < rowCount}
                                    checked={selectionCount > 0 && selectionCount === rowCount}
                                    onClick={() => onToggleSelectAll()}
                                />
                            )}
                        </TableCell>
                    )}

                    {columns.map((column, index) => (
                        <TableCell
                            key={column.id}
                            sx={column.headStyle}
                            className={cx(muiTableHeadClasses.cell, {
                                [muiTableHeadClasses.allCaps]: allCapsHeader,
                                [muiTableHeadClasses.cellNoWrap]: noWrap,
                            })}
                            align={column.align}
                            sortDirection={sortable && column.sortable && sortBy === column.id ? sortDirection : false}
                            colSpan={index === columns.length - 1 ? 2 : undefined} // colspan over row actions column
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

                    {/* {hasRowActions && ( */}
                    {/* <TableCell
                            className={cx(muiTableHeadClasses.cell, muiTableHeadClasses.cellRowActions)}
                        /> */}
                    {/* )} */}
                </TableRow>
            </Root>
        );
    }
}

export { MuiTableHead as TableHead };
