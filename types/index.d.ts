import { CSSProperties, ClassNameMap } from "@material-ui/styles";
import { SortDirection } from "@material-ui/core";

export type TableRowId = string | number;
export type TableColumnId = string;

export interface TableRowItem {
    _id: TableRowId;
    [key: string]: any;
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

export interface TableColumn {
    id: TableColumnId;
    name: string;
    defaultValue?: any;
    display?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
    dateTime?: boolean;
    align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
    headStyle?: CSSProperties;
    bodyStyle?: CSSProperties;
    customHead?: () => React.ReactNode;
    customBody?: () => React.ReactNode;
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

export interface TableProps {
    className: string | undefined;
    headClasses: Partial<ClassNameMap> | undefined;
    bodyClasses: Partial<ClassNameMap> | undefined;
    data: Omit<TableRowItem, '_id'>[];
    dataId: string;
    columns: TableColumn[];
    options: TableOptions;
}

export interface TableState {
    columns: TableColumn[];
    data: TableRowItem[];
    originalData: Omit<TableRowItem, '_id'>[];
    displayData: TableRowItem[];
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
}

export interface TableOptions {
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
    onRowActions?: (rowId: TableRowId, rowItem: TableRowItem, rowIndex: number) => TableAction[];
    onRowClick?: (rowId: TableRowId, rowItem: TableRowItem, rowIndex: number) => void;
    onRowSelect?: (rowId: TableRowId, rowItem: TableRowItem, rowIndex: number) => void;
    onRowExpand?: (rowId: TableRowId, rowItem: TableRowItem, rowIndex: number) => void;
    onRowSelectionsChange?: (nextRowSelections: TableRowId[], prevRowSelections: TableRowId[]) => void;
    onRowExpansionsChange?: (nextRowExpansions: TableRowId[], prevRowExpansions: TableRowId[]) => void;
    onRowStatus?: (rowId: TableRowId, rowItem: TableRowItem, rowIndex: number) => TableRowStatus;
    onCellClick?: (rowId: TableRowId, columnId: TableColumnId, rowItem: TableRowItem, rowIndex: number, columnIndex: number) => void;
    onCellStatus?: (rowId: TableRowId, columnId: TableColumnId, rowItem: TableRowItem, rowIndex: number, columnIndex: number) => TableCellStatus;
    onStateChange?: (newState: TableState, prevState: TableState) => void;
    dependencies?: any[];
    ToolbarComponent?: React.ComponentType<any>;
    RowExpandComponent?: React.ComponentType<any>;
    FilterComponents?: React.ElementType<TableFilterComponentProps>[];
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

export interface TableFilterComponentProps {
    column?: string,
    columnData?: (item: TableRowItem) => string;
    data: TableRowItem[];
    displayData: TableRowItem[];
    onUpdateFilter: (ids: TableRowId[] | null) => void;
}