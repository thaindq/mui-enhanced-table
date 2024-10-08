import { SortDirection, TableCellProps, TablePaginationProps, TextFieldProps } from '@mui/material';
import { CSSProperties, ReactNode } from 'react';
import { TableSearchProps, TableToolbarProps } from './components';

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
    formatter?: Formatter<T> | ((props: FormatterProps<T>) => ReactNode);
    getValue?: (item: T) => string | number;
}

export interface TableCellStatus {
    style?: CSSProperties;
    className?: string;
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
        refresh?: ReactNode;
        export?: ReactNode;
        columns?: ReactNode;
    };
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

export interface PaginatedData<T = any> {
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
    data: readonly T[] | ((query: DataQuery) => Promise<PaginatedData<T>>);
    dataId?: string | ((data: T) => string);
    columns: readonly TableColumn<T>[];
    status?: TableStatus;
    isLoading?: boolean;
    isError?: boolean;
    options?: TableOptions;
    init?: TableInitData<T>;
    dependencies?: any[];
    components?: TableComponents<T>;
    translations?: TableTranslations;
    defaultComponentProps?: DefaultTableComponentProps;
    icons?: TableIcons;
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
    onNoDataMessage?: (data: readonly TableRow<T>[]) => ReactNode;
    onErrorMessage?: (data: readonly TableRow<T>[]) => ReactNode;
}

export interface TableState<T = any> {
    columns: readonly TableColumn<T>[];
    rawColumns: readonly TableColumn<T>[];
    data: readonly TableRow<T>[];
    rawData: TableProps<T>['data'];
    status: TableStatus;
    isLoading: boolean;
    isError: boolean;
    itemCount: number;
    displayData: readonly TableRow<T>[];
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

export interface TableComponents<T = any> {
    search?: React.ComponentType<Omit<TableSearchProps<T>, 'TextFieldProps'>>;
    toolbar?: React.ComponentType<TableToolbarProps>;
    actions?: TableAction[] | (() => React.ReactElement);
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
    refresh?: string;
    export?: string;
    columns?: string;
    resetDefault?: string;
}

export interface DefaultTableComponentProps {
    SearchProps?: Partial<TextFieldProps>;
    TablePaginationProps?: Partial<TablePaginationProps>;
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
    format(props: FormatterProps<T>): ReactNode;
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
    onFilterUpdate: (matchedRowIds: TableRowId[] | null, filterData?: any) => void;
}
