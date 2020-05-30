export { default } from './Table';
export * from './Table';
export * from './components';
export * from './utils';
export * from './filters';
export * from './formatters';
import { TableHeadClassKey, TableBodyClassKey } from './components';
import { SortDirection, TableCellProps } from "@material-ui/core";
import { ClassNameMap, CSSProperties } from "@material-ui/styles";

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

export type TableStatus = 'Idle' | 'Pending' | 'Completed' | 'Error';

export interface TableColumn<T = any> extends Pick<TableCellProps, 'align'> {
    id: TableColumnId;
    name: string;
    defaultValue?: any;
    display?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
    dateTime?: boolean;
    headStyle?: CSSProperties;
    bodyStyle?: CSSProperties;
    formatter?: Formatter<T> | ((props: FormatterProps<T>) => React.ReactNode);
}

export interface TableCellStatus {
    style?: CSSProperties;
    className?: string;
}

export interface TableOptions<T = any> {    
    sortable?: boolean;
    elevation?: number;
    filterable?: boolean;
    selectable?: boolean;
    expandable?: boolean;
    multiSelect?: boolean;
    multiExpand?: boolean;
    searchable?: boolean;
    rowsPerPageOptions?: number[];
    showBorder?: boolean;
    showToolbar?: boolean;
    showHeader?: boolean;
    showPagination?: boolean;
    stickyHeader?: boolean;
    allCapsHeader?: boolean;
    noWrap?: boolean;
    highlightRow?: boolean;
    highlightColumn?: boolean;
    alternativeRowColor?: boolean;
    component?: 'div';
}

export interface TableProps<T = any> {
    className?: string;
    headClasses?: Partial<ClassNameMap<TableHeadClassKey>>;
    bodyClasses?: Partial<ClassNameMap<TableBodyClassKey>>;
    title?: string;
    data: readonly T[];
    dataId?: string;
    columns: readonly TableColumn<T>[];
    status?: TableStatus;
    options?: TableOptions<T>;
    init?: TableInitData<T>;
    dependencies?: any[];
    components?: TableComponents<T>;
    onRowClick?: (rowId: TableRowId, rowData: T, rowIndex: number) => void;
    onRowSelect?: (rowId: TableRowId, rowData: T, rowIndex: number, selected: boolean) => void;
    onRowExpand?: (rowId: TableRowId, rowData: T, rowIndex: number, expanded: boolean) => void;
    onRowSelectionsChange?: (nextRowSelections: TableRowId[], prevRowSelections: TableRowId[]) => void;
    onRowExpansionsChange?: (nextRowExpansions: TableRowId[], prevRowExpansions: TableRowId[]) => void;
    onRowStatus?: (rowId: TableRowId, rowData: T, rowIndex: number) => TableRowStatus;
    onCellClick?: (rowId: TableRowId, columnId: TableColumnId, rowData: T, rowIndex: number, columnIndex: number) => void;
    onCellStatus?: (rowId: TableRowId, columnId: TableColumnId, rowData: T, rowIndex: number, columnIndex: number) => TableCellStatus;
    onStateChange?: (newState: TableState<T>, prevState: TableState<T>) => void;
    onNoDataMessage?: (data: readonly TableRow<T>[]) => React.ReactNode;
    onErrorMessage?: (data: readonly TableRow<T>[]) => React.ReactNode;
}

export interface TableState<T = any> {
    columns: readonly TableColumn<T>[];
    data: readonly TableRow<T>[];
    originalData: readonly T[];
    displayData: readonly TableRow<T>[];
    filteredData: (TableRowId[] | null)[];
    columnHidings: TableColumnId[];
    rowExpansions: TableRowId[];
    rowSelections: TableRowId[];
    sortBy: TableColumnId;
    sortDirection: SortDirection;
    currentPage: number;
    rowsPerPage: number;
    searchText: string;
    searchMatchers: SearchMatchers | null;
    options: TableOptions<T>;
    dependencies?: any[];    
}

export type TableInitData<T = any> = Partial<Pick<TableState<T>, 'columnHidings' | 'rowExpansions' | 'rowSelections' | 'sortBy' | 'sortDirection' | 'currentPage' | 'rowsPerPage' | 'searchText'>>;

export interface TableAction {
    name: string;
    className?: string;    
    icon?: React.ReactNode;
    button?: React.ReactNode;
    disabled?: boolean;
    callback: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface TableFilter<T = any> {
    name?: string,
    field: string,
    component: React.ComponentType<FilterProps<T>>
}

export interface TableComponents<T = any> {
    filters?: TableFilter<T>[];
    actions?: TableAction[] | (() => React.ReactElement);
    customs?: React.ComponentType<TableProps<T>>[];
    rowExpand?: React.ComponentType<{
        id: TableRowId;
        data: T;
        index: number;
    }>;
    rowActions?: ((rowId: TableRowId, rowData: T, rowIndex: number) => (React.ReactElement | TableAction[])) | TableAction[];
}

export interface SearchMatcher {
    pre: string;
    post: string;
    match: string;
}

export interface SearchMatchers {
    [rowId: string]: {
        [columnId: string]: SearchMatcher | null;
    }
}

export interface Formatter<T = any> {
    format(props: FormatterProps<T>): React.ReactNode;
    getValueString(value: any): string;
}

export type FormatterProps<T = any> = {
    value: any, 
    matcher?: SearchMatcher | null,
    selected?: boolean, 
    expanded?: boolean, 
    item: T 
};

export interface FilterProps<T = any> {
    filterId: number;
    filterBy?: TableColumnId | ((row: TableRow<T>) => TableColumnId);
    data: readonly TableRow<T>[];
    onUpdateFilter: (filterId: number, matchedRowIds: TableRowId[] | null) => void;
}