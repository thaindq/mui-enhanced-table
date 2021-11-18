import { SortDirection, TableCellProps } from '@mui/material';
import { CSSProperties } from 'react';

export type TableRowId = string;
export type TableColumnId = string;

export interface TableRow<T = any> {
    id: TableRowId;
    data: T;
}

export interface TableRowStatus {
    style?: CSSProperties;
    tooltip?: string;
    disabled?: boolean;
    className?: string;
    highlighted?: boolean;
    selected?: boolean;
    expanded?: boolean;
}

export type TableStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

export interface TableColumn<T = any> extends Pick<TableCellProps, 'align'> {
    id: TableColumnId;
    name: string;
    defaultValue?: any;
    display?: boolean;
    sortable?: boolean;
    sortBy?: (value: any) => number | string;
    filterable?: boolean;
    searchable?: boolean;
    dateTime?: boolean;
    headStyle?: CSSProperties;
    bodyStyle?: CSSProperties;
    formatter?: Formatter<T> | ((props: FormatterProps<T>) => React.ReactNode);
    getValue?: (item: T) => string | number;
}

export interface TableCellStatus {
    style?: CSSProperties;
    className?: string;
}

export interface TableOptions {
    sortable?: boolean;
    elevation?: number;
    filterable?: boolean;
    selectable?: boolean;
    expandable?: boolean;
    multiSelect?: boolean;
    multiExpand?: boolean;
    searchable?: boolean;
    exportable?: boolean;
    rowsPerPageOptions?: number[];
    showBorder?: boolean;
    showTitle?: boolean;
    showActions?: boolean;
    showToolbar?: boolean;
    showHeader?: boolean;
    showPagination?: boolean;
    respectDataStatus?: boolean;
    stickyHeader?: boolean;
    allCapsHeader?: boolean;
    noWrap?: boolean;
    highlightRow?: boolean;
    highlightColumn?: boolean;
    alternativeRowColor?: boolean;
    dataLimit?: number;
    component?: 'div';
}

export interface TableProps<T = any> {
    className?: string;
    title?: string;
    data: readonly T[];
    dataId?: string | ((data: T) => string);
    columns: readonly TableColumn<T>[];
    status?: TableStatus;
    options?: TableOptions;
    init?: TableInitData<T>;
    dependencies?: any[];
    components?: TableComponents<T>;
    onRowClick?: (rowId: TableRowId, rowData: T, rowIndex: number) => void;
    onRowSelect?: (rowId: TableRowId, rowData: T, rowIndex: number, selected: boolean) => void;
    onRowExpand?: (rowId: TableRowId, rowData: T, rowIndex: number, expanded: boolean) => void;
    onRowSelectionsChange?: (
        nextRowSelections: TableRowId[],
        prevRowSelections: TableRowId[],
        rowSelections: T[],
    ) => void;
    onRowExpansionsChange?: (
        nextRowExpansions: TableRowId[],
        prevRowExpansions: TableRowId[],
        rowSelections: T[],
    ) => void;
    onRowStatus?: (rowId: TableRowId, rowData: T, rowIndex: number) => TableRowStatus;
    onCellClick?: (
        rowId: TableRowId,
        columnId: TableColumnId,
        rowData: T,
        rowIndex: number,
        columnIndex: number,
    ) => void;
    onCellStatus?: (
        rowId: TableRowId,
        columnId: TableColumnId,
        rowData: T,
        rowIndex: number,
        columnIndex: number,
    ) => TableCellStatus;
    onDataExport?: (content: string[][]) => void;
    onStateChange?: (newState: TableState<T>, prevState: TableState<T>) => void;
    onNoDataMessage?: (data: readonly TableRow<T>[]) => React.ReactNode;
    onErrorMessage?: (data: readonly TableRow<T>[]) => React.ReactNode;
}

export interface TableState<T = any> {
    columns: readonly TableColumn<T>[];
    originalColumns: readonly TableColumn<T>[];
    data: readonly TableRow<T>[];
    originalData: readonly T[];
    displayData: readonly TableRow<T>[];
    filteredData: (TableRowId[] | null)[];
    rowExpansions: TableRowId[];
    rowSelections: TableRowId[];
    sortBy: TableColumnId;
    sortDirection: SortDirection;
    currentPage: number;
    rowsPerPage: number;
    searchText: string;
    searchMatchers: SearchMatchers | null;
    options: TableOptions;
    dependencies?: any[];
}

export type TableInitData<T = any> = Partial<
    Pick<
        TableState<T>,
        'rowExpansions' | 'rowSelections' | 'sortBy' | 'sortDirection' | 'currentPage' | 'rowsPerPage' | 'searchText'
    >
> & {
    hiddenColumns?: TableColumnId[];
    columnOrders?: TableColumnId[];
};

export interface TableAction {
    name: string;
    className?: string;
    icon?: React.ReactNode;
    button?: React.ReactNode;
    disabled?: boolean;
    callback: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface TableFilter<T = any> {
    name?: string;
    field: string;
    component: React.ComponentType<FilterProps<T>>;
}

export interface TableComponents<T = any> {
    filters?: TableFilter<T>[];
    actions?: TableAction[] | (() => React.ReactElement);
    customs?: React.ComponentType<TableProps<T>>[];
    customsBottom?: React.ComponentType<TableProps<T>>[];
    rowExpand?: React.ComponentType<{
        id: TableRowId;
        data: T;
        index: number;
    }>;
    rowActions?:
        | ((rowId: TableRowId, rowData: T, rowIndex: number) => React.ReactElement | TableAction[])
        | TableAction[];
}

export interface SearchMatcher {
    pre: string;
    post: string;
    match: string;
}

export interface SearchMatchers {
    [rowId: string]: {
        [columnId: string]: SearchMatcher | null;
    };
}

export interface Formatter<T = any> {
    format(props: FormatterProps<T>): React.ReactNode;
    getValueString(value: any, item: T): string;
}

export type FormatterProps<T = any> = {
    value: any;
    matcher?: SearchMatcher | null;
    selected?: boolean;
    expanded?: boolean;
    item: T;
};

export interface FilterProps<T = any> {
    name?: string;
    filterBy: TableColumnId | ((row: TableRow<T>) => TableColumnId);
    data: readonly TableRow<T>[];
    displayData: readonly TableRow<T>[];
    onUpdateFilter: (matchedRowIds: TableRowId[] | null) => void;
}
