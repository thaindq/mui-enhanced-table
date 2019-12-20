import { SortDirection, TableCellProps } from "@material-ui/core";
import { ClassNameMap, CSSProperties } from "@material-ui/styles";
import { Formatter, FormatFunction } from "../src/formatters/BaseFormatter";

export type TableRowId = string | number;
export type TableColumnId = string;

export interface TableRow<T> {
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
    formatter?: Formatter<T> | FormatFunction<T>;
}

export interface TableCellStatus {
    style?: CSSProperties;
    className?: string;
}

export interface TableAction {
    name: string;
    className?: string;
    icon?: React.ReactNode;
    button?: React.ReactNode;
    disabled?: boolean;
    callback: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface TableProps<T = any> {
    className?: string | undefined;
    headClasses?: Partial<ClassNameMap> | undefined;
    bodyClasses?: Partial<ClassNameMap> | undefined;
    data: T[];
    dataId?: string;
    columns: TableColumn[];
    options: TableOptions<T>;
}

export interface TableState<T = any> {
    columns: TableColumn[];
    data: TableRow<T>[];
    originalData: T[];
    displayData: TableRow<T>[];
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
}

export interface TableOptions<T = any> {
    title?: string;
    sortBy?: TableColumnId;
    sortDirection?: SortDirection;
    sortable?: boolean;
    elevation?: number;
    filterable?: boolean;
    selectable?: boolean;
    expandable?: boolean;
    multiSelect?: boolean;
    multiExpand?: boolean;
    searchable?: boolean;
    rowsPerPage?: number;
    rowsPerPageOptions?: number[];
    showBorder?: boolean;
    showToolbar?: boolean;
    showHeaders?: boolean;
    pagination?: boolean;
    noWrap?: boolean;
    highlightRow?: boolean;
    highlightColumn?: boolean;
    alternativeRowColor?: boolean;    
    currentPage?: number;
    columnHidings?: TableColumnId[];
    rowExpansions?: TableRowId[];
    rowSelections?: TableRowId[];
    customActions?: TableAction[];
    onRowActions?: (rowId: TableRowId, rowData: T, rowIndex: number) => TableAction[];
    onRowClick?: (rowId: TableRowId, rowData: T, rowIndex: number) => void;
    onRowSelect?: (rowId: TableRowId, rowData: T, rowIndex: number) => void;
    onRowExpand?: (rowId: TableRowId, rowData: T, rowIndex: number) => void;
    onRowSelectionsChange?: (nextRowSelections: TableRowId[], prevRowSelections: TableRowId[]) => void;
    onRowExpansionsChange?: (nextRowExpansions: TableRowId[], prevRowExpansions: TableRowId[]) => void;
    onRowStatus?: (rowId: TableRowId, rowData: T, rowIndex: number) => TableRowStatus;
    onCellClick?: (rowId: TableRowId, columnId: TableColumnId, rowData: T, rowIndex: number, columnIndex: number) => void;
    onCellStatus?: (rowId: TableRowId, columnId: TableColumnId, rowData: T, rowIndex: number, columnIndex: number) => TableCellStatus;
    onStateChange?: (newState: TableState<T>, prevState: TableState<T>) => void;
    dependencies?: any[];
    ToolbarComponent?: React.ComponentType<any>;
    RowExpandComponent?: React.ComponentType<any>;
    FilterComponents?: React.ElementType<TableFilterComponentProps<T>>[];
    CustomComponents?: React.ElementType<any>[];
}

export interface SearchMatcher {
    pre: string;
    post: string;
    match: string;
}

export interface SearchMatchers {
    [rowId: string]: {
        [columnId: string]: SearchMatcher | null
    }
}

export interface TableFilterComponentProps<T = any> {
    column?: string,
    columnData?: (item: TableRow<T>) => string;
    data: TableRow<T>[];
    displayData: TableRow<T>[];
    onUpdateFilter: (ids: TableRowId[] | null) => void;
}