import { SortDirection, TableCellProps, Theme } from "@material-ui/core";
import { CSSProperties } from "@material-ui/styles";

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
    formatter?: React.FunctionComponent<FormatterProps<T>> | Formatter<T>;
}

export interface TableCellStatus {
    style?: CSSProperties;
    className?: string;
}

export interface TableAction {
    name: string;
    className?: string;    
    icon?: React.ReactNode | string;
    button?: React.ReactNode;
    disabled?: boolean;
    callback: (event: React.MouseEvent<HTMLElement>) => void;
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
    matcher: SearchMatcher | null, 
    theme: Theme, 
    selected: boolean, 
    expanded: boolean, 
    item: T 
};

export interface FilterProps<T = any> {
    filterId: number;
    filterBy?: TableColumnId | ((row: TableRow<T>) => TableColumnId);
    data: TableRow<T>[];
    onUpdateFilter: (filterId: number, matchedRowIds: TableRowId[] | null) => void;
}