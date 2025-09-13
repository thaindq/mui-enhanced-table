import { Checkbox, SortDirection, styled, TableCell, TableHead, TableRow, TableSortLabel } from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import { TableColumn, TableColumnId, TableOptions } from '../types';
import { generateNamesObject } from '../utils';

export const muiTableHeadClasses = generateNamesObject(
    ['root', 'row', 'cell', 'cellNoWrap', 'allCaps', 'cellRowActions'],
    'MuiTableHead',
);

const Root = styled(TableHead)(({ theme }) => ({
    [`& .${muiTableHeadClasses.cellNoWrap}`]: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        unicodeBidi: 'plaintext',
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
    displayCount?: number;
    sortBy?: TableColumnId;
    sortDirection?: SortDirection;
    hasRowActions?: boolean;
    isPending: boolean;
    onToggleSelectAll: () => void;
    onSortData: (columnId: TableColumnId, direction?: SortDirection) => void;
}

const MuiTableHead: React.FunctionComponent<TableHeadProps> = ({
    className,
    columns,
    options,
    selectionCount,
    displayCount,
    sortBy,
    sortDirection,
    hasRowActions,
    isPending,
    onToggleSelectAll,
    onSortData,
}) => {
    const { noWrap, sortable, selectable, expandable, allCapsHeader, multiSelect } = options;

    return (
        <Root className={clsx(className, muiTableHeadClasses.root)}>
            <TableRow className={muiTableHeadClasses.row}>
                {expandable && <TableCell className={muiTableHeadClasses.cell} />}

                {selectable && (
                    <TableCell className={muiTableHeadClasses.cell}>
                        {multiSelect && selectionCount !== undefined && displayCount !== undefined && (
                            <Checkbox
                                disabled={isPending}
                                indeterminate={selectionCount > 0 && selectionCount < displayCount}
                                checked={selectionCount > 0 && selectionCount === displayCount}
                                onClick={() => onToggleSelectAll()}
                            />
                        )}
                    </TableCell>
                )}

                {columns.map((column) => (
                    <TableCell
                        key={column.id}
                        style={column.headStyle}
                        className={clsx(muiTableHeadClasses.cell, {
                            [muiTableHeadClasses.allCaps]: allCapsHeader,
                            [muiTableHeadClasses.cellNoWrap]: noWrap,
                        })}
                        align={column.align}
                        sortDirection={sortable && column.sortable && sortBy === column.id ? sortDirection : false}
                    >
                        {sortable && column.sortable ? (
                            <TableSortLabel
                                active={sortable && sortBy === column.id && !!sortDirection}
                                direction={sortDirection !== false ? sortDirection : undefined}
                                onClick={!sortable ? undefined : () => onSortData(column.id)}
                            >
                                {column.name}
                            </TableSortLabel>
                        ) : (
                            column.name
                        )}
                    </TableCell>
                ))}

                {hasRowActions && (
                    <TableCell className={clsx(muiTableHeadClasses.cell, muiTableHeadClasses.cellRowActions)} />
                )}
            </TableRow>
        </Root>
    );
};

export { MuiTableHead as TableHead };
