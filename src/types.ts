import { SetRequired } from 'type-fest';
import {
    SortDirection,
    TableCellProps,
    TablePaginationProps,
    TextFieldProps,
    TableProps as MuiTableProps,
} from '@mui/material';
import React, { CSSProperties, ReactNode } from 'react';
import { TableSearchProps, TableToolbarProps } from './components';

type Paths<T> = T extends object
    ? { [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}` }[keyof T]
    : never;

type Leaves<T> = T extends object
    ? { [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never ? '' : `.${Leaves<T[K]>}`}` }[keyof T]
    : never;

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

export interface TableCellStatus {
    style?: CSSProperties;
    className?: string;
}

export interface TableColumn<T = any, V = any> extends Pick<TableCellProps, 'align'> {
    id: TableColumnId;
    name: string;
    display?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
    dateTime?: boolean;
    headStyle?: CSSProperties;
    bodyStyle?: CSSProperties;
    formatter?: Formatter<T, V> | React.FunctionComponent<FormatterProps<T, V>>;
    getValue?: (item: T) => V;
    getSortValue?: (value: V) => number | string;
}

export interface TableIcons {
    rowExpand?: ReactNode;
    rowCollapse?: ReactNode;
    search?: ReactNode;
    pagination?: {
        firstPage?: ReactNode;
        previousPage?: ReactNode;
        nextPage?: ReactNode;
        lastPage?: ReactNode;
    };
    toolbar?: {
        search?: ReactNode;
        refresh?: ReactNode;
        export?: ReactNode;
        columns?: ReactNode;
    };
}

export interface TableOptions {
    size?: MuiTableProps['size'];
    sortable?: boolean;
    elevation?: number;
    filterable?: boolean;
    selectable?: boolean;
    expandable?: boolean;
    multiSelect?: boolean;
    multiExpand?: boolean;
    searchable?: boolean;
    exportable?: boolean;
    refreshable?: boolean;
    rowsPerPageOptions?: number[];
    showBorder?: boolean;
    showTitle?: boolean;
    showActions?: boolean;
    showToolbar?: boolean;
    showHeader?: boolean;
    showPagination?: boolean | 'top' | 'bottom';
    stickyHeader?: boolean;
    allCapsHeader?: boolean;
    noWrap?: boolean;
    loader?: 'skeleton' | 'overlay' | 'dynamic';
    highlightRow?: boolean;
    alternativeRowColor?: boolean;
    pollingInterval?: number;
    skeletonRows?: number;
}

export interface DataQuery {
    pageNumber: number;
    pageSize: number;
    searchText: string;
    sortBy: string;
    sortDirection: SortDirection;
    filters: Record<string, any[]>;
}

export interface BackendData<T = any> {
    items: T[];
    itemCount: number;
}

export interface TableProps<T = any> {
    children?:
        | React.ReactNode
        | ((props: {
              data: TableState<T>['data'];
              displayData: TableState<T>['displayData'];
              onFilterUpdate: (filterId: string, matchedRowIds: TableRowId[] | null, filterData?: any) => void;
          }) => React.ReactElement);
    className?: string;
    title?: string;
    data: T[] | BackendData<T> | ((query: DataQuery) => Promise<BackendData<T>>);
    dataId?: string | ((data: T) => string);
    columns: TableColumn<T>[];
    isLoading?: boolean;
    isError?: boolean;
    options?: TableOptions;
    init?: TableInitData<T>;
    dependencies?: any[];
    slots?: TableSlots<T>;
    translations?: TableTranslations;
    slotProps?: SlotProps;
    icons?: TableIcons;
    onDataQuery?: (query: DataQuery) => void;
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
    onColumnsReset?: VoidFunction;
    onColumnsToggle?: (columns: TableColumnId[]) => void;
    onStateChange?: (newState: TableState<T>, prevState: TableState<T>) => void;
    onNoDataMessage?: (data: TableRow<T>[]) => ReactNode;
    onErrorMessage?: (data: TableRow<T>[]) => ReactNode;
}

export interface TableState<T = any> {
    columns: SetRequired<TableColumn<T>, 'getValue'>[];
    rawColumns: TableColumn<T>[];
    data: TableRow<T>[];
    rawData: TableProps<T>['data'];
    isLoading: boolean;
    isError: boolean;
    itemCount: number;
    displayData: TableRow<T>[];
    filteredRowIds: Record<string, TableRowId[] | null>;
    filterData: Record<string, any[]>;
    expandedRowIds: TableRowId[];
    selectedRowIds: TableRowId[];
    sortBy: TableColumnId;
    sortDirection: SortDirection;
    currentPage: number;
    rowsPerPage: number;
    searchText: string;
    searchMatchers: SearchMatchers | null;
    options: Required<TableOptions>;
    rawOptions?: TableOptions;
    dependencies?: any[];
    staleData: boolean;
}

export type TableInitData<T = any> = Partial<
    Pick<
        TableState<T>,
        'expandedRowIds' | 'selectedRowIds' | 'sortBy' | 'sortDirection' | 'currentPage' | 'rowsPerPage' | 'searchText'
    >
> & {
    hiddenColumns?: TableColumnId[];
    columnOrders?: TableColumnId[];
};

export interface TableAction {
    name: string;
    className?: string;
    icon?: ReactNode;
    button?: ReactNode;
    disabled?: boolean;
    callback: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface TableSlots<T = any> {
    search?: React.ComponentType<TableSearchProps>;
    toolbar?: React.ComponentType<TableToolbarProps>;
    pagination?: React.ComponentType<TablePaginationProps>;
    actions?: TableAction[] | (() => React.ReactElement);
    selectActions?: TableAction[] | (() => React.ReactElement);
    rowExpand?: React.ComponentType<{
        id: TableRowId;
        data: T;
        index: number;
    }>;
    rowActions?:
        | ((rowId: TableRowId, rowData: T, rowIndex: number) => React.ReactElement | TableAction[])
        | TableAction[];
}

export interface TableTranslations {
    search?: string;
    refresh?: string;
    export?: string;
    columns?: string;
    selected?: string;
    resetDefault?: string;
    untitled?: string;
    firstPage?: string;
    lastPage?: string;
    nextPage?: string;
    previousPage?: string;
    expand?: string;
    collapse?: string;
    pagination?: TablePaginationProps['labelDisplayedRows'];
}

export interface SlotProps {
    search?: Partial<TextFieldProps>;
    pagination?: Partial<TablePaginationProps>;
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

export interface Formatter<T = any, V = any> {
    format: React.FunctionComponent<FormatterProps<T, V>>;
}

export type FormatterProps<T = any, V = any> = {
    value: V;
    matcher?: SearchMatcher | null;
    selected?: boolean;
    expanded?: boolean;
    item: T;
};

export interface FilterProps<T = any> {
    name?: string;
    filterBy: TableColumnId | ((row: TableRow<T>) => TableColumnId);
    data: TableRow<T>[];
    displayData: TableRow<T>[];
    onFilterUpdate: (matchedRowIds: TableRowId[] | null, filterData?: any) => void;
}
