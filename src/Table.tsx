import { createStyles, FormControl, IconButton, Input, InputAdornment, Paper, SortDirection, Table, TablePagination, TableProps as MuiTableProps, Theme, Typography, withStyles } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import { WithStyles, StyledComponentProps, ClassNameMap } from '@material-ui/styles';
import cx from 'classnames';
import _ from 'lodash';
import React, { GetDerivedStateFromProps } from 'react';
import { DragDropContext, Droppable, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import { SearchMatcher, SearchMatchers, TableColumnId, TableRow, TableRowId, TableColumn, TableAction, TableRowStatus, FilterProps, TableStatus, TableCellStatus } from '../types';
import TableBody, { TableBodyClassKey } from './components/TableBody';
import TableHead, { TableHeadClassKey } from './components/TableHead';
import TablePaginationActions from './components/TablePaginationActions';
import TableToolbar from './components/TableToolbar';
import SearchHighlightedFormatter from './formatters/SearchHighlightedFormatter';
import Utils from './utils';

const styles = (theme: Theme) => createStyles({
    root: {
        width: '100%',
        // height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    container: {
        overflowX: 'auto',
        // height: '100%'
    },
    border: {
        border: `1px solid rgb(110, 110, 110)`
    },
    table: {
        position: 'relative',
        display: 'table',
    },
    search: {
        flexGrow: 1,
        flexWrap: 'nowrap',
        margin: '12px 16px',
    },
    clearSearchButton: {
        width: 20,
        height: 20,
        fontSize: '16px',
        '& > span': {
            position: 'absolute'
        }
    },
    paginationContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        flexShrink: 0,
        '& > *:last-child': {
            flexGrow: 2,
        }
    },
    loader: {
        top: 0,
        left: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.palette.action.disabledBackground,
        '& ~ *': {
            opacity: 0.25,
        }
    },
    customComponentsContainer: {

    },
    filtersContainer: {
        paddingLeft: 16,
        paddingRight: 8
    },    
});

export interface TableOptions<T = any> {    
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
    status?: TableStatus;
    rowsPerPage?: number;
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
    currentPage?: number;
    columnHidings?: TableColumnId[];
    rowExpansions?: TableRowId[];
    rowSelections?: TableRowId[];
    customActions?: TableAction[];
    rowActions?: (rowId: TableRowId, rowData: T, rowIndex: number) => React.ReactElement;
    onRowClick?: (rowId: TableRowId, rowData: T, rowIndex: number) => void;
    onRowSelect?: (rowId: TableRowId, rowData: T, rowIndex: number, selected: boolean) => void;
    onRowExpand?: (rowId: TableRowId, rowData: T, rowIndex: number, expanded: boolean) => void;
    onRowSelectionsChange?: (nextRowSelections: TableRowId[], prevRowSelections: TableRowId[]) => void;
    onRowExpansionsChange?: (nextRowExpansions: TableRowId[], prevRowExpansions: TableRowId[]) => void;
    onRowStatus?: (rowId: TableRowId, rowData: T, rowIndex: number) => TableRowStatus;
    onCellClick?: (rowId: TableRowId, columnId: TableColumnId, rowData: T, rowIndex: number, columnIndex: number) => void;
    onCellStatus?: (rowId: TableRowId, columnId: TableColumnId, rowData: T, rowIndex: number, columnIndex: number) => TableCellStatus;
    onStateChange?: (newState: TableState<T>, prevState: TableState<T>) => void;
    dependencies?: any[];
    rowExpandComponent?: React.ComponentType<{
        id: TableRowId;
        data: T;
        index: number;
    }>;
    filterComponents?: {
        name: string,
        field: string,
        component: React.ComponentType<FilterProps<T>>
    }[];
    customComponents?: React.ComponentType<TableProps<T>>[];
}

export interface TableProps<T = any> {
    className?: string;
    headClasses?: Partial<ClassNameMap<TableHeadClassKey>>;
    bodyClasses?: Partial<ClassNameMap<TableBodyClassKey>>;
    title?: string;
    data: readonly T[];
    dataId?: keyof T;
    columns: readonly TableColumn<T>[];
    options?: TableOptions<T>;
}

interface TableState<T = any> {
    columns: readonly TableColumn<T>[];
    data: TableRow<T>[];
    originalData: readonly T[];
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

class MuiTable<T = any> extends React.Component<TableProps<T> & WithStyles<typeof styles>, TableState<T>> {
    static defaultProps: Omit<Required<TableProps>, 'data' | 'columns'> = {
        className: '',
        title: '',
        headClasses: {},
        bodyClasses: {},
        dataId: '',
        options: {
            sortBy: '',
            sortDirection: 'asc',
            sortable: true,
            filterable: true,
            selectable: false,
            expandable: false,
            multiSelect: true,
            multiExpand: true,
            searchable: true,
            showPagination: true,
            rowsPerPage: 10,
            rowsPerPageOptions: [10, 20, 40],
            currentPage: 0,
            status: 'Idle',
            showBorder: false,
            showToolbar: true,
            showHeader: true,
            stickyHeader: false,
            allCapsHeader: true,
            highlightRow: true,
            highlightColumn: false,
            alternativeRowColor: true,
            elevation: 1,
            columnHidings: [],
            rowSelections: [],
            rowExpansions: [],
            filterComponents: [],
            customComponents: [],
        }
    }

    static defaultState: TableState = {
        columns: [],
        data: [],
        originalData: [],
        displayData: [],
        filteredData: [],
        columnHidings: [],
        rowSelections: [],
        rowExpansions: [],
        sortBy: '',
        sortDirection: false,
        currentPage: 0,
        rowsPerPage: 10,
        searchText: '',
        searchMatchers: null,
        options: MuiTable.defaultProps.options,
    };

    static getInitialState = (props: TableProps): TableState => {
        const {
            data,
            dataId,
            columns,
        } = props;

        const mergedOptions = {
            ...MuiTable.defaultProps.options,
            ...props.options
        } as Required<TableOptions>;

        const {
            rowsPerPage,
            columnHidings,
            rowSelections,
            rowExpansions,
            sortBy,
            sortDirection,
            currentPage,
        } = mergedOptions;

        const seenColumnIds: string[] = [];
        const tableData = data.map((item, index) => {
            return {
                id: String(!!dataId ? item[dataId] : index),
                data: item,
            };
        });

        return {
            ...MuiTable.defaultState,
            rowsPerPage,
            columnHidings,
            rowSelections,
            rowExpansions,
            sortBy,
            sortDirection,
            currentPage,
            // tableHeight: pagination && (rowsPerPage * 40 + (showHeaders ? 56 : 0) + 1),
            options: mergedOptions,
            originalData: data,
            data: tableData,
            displayData: tableData,
            columns: columns.map(column => {
                const {
                    id,
                    name = '',
                    display = true,
                    sortable = true,
                    filterable = true,
                    searchable = true,
                    formatter = SearchHighlightedFormatter.getInstance(),
                    ...rest
                } = column;

                if (id === undefined) {
                    throw new Error(`Columns must have \`id\`:\n${JSON.stringify(column, null, 4)}`);
                }

                if (seenColumnIds.includes(id)) {
                    throw new Error(`Column's \`id\` must be unique. Duplicated id: ${id}`);
                } else {
                    seenColumnIds.push(id);
                }

                return {
                    id,
                    name,
                    display,
                    sortable,
                    filterable,
                    searchable,
                    formatter,
                    ...rest,
                };
            }),
        };
    }

    static getNextState = (newValues: Partial<TableState>, prevState: TableState): TableState => {
        const mergedState = {
            ...prevState,
            ...newValues,
        };

        const {
            data,
            columns,
            filteredData,
            searchText,
            currentPage,
            sortBy,
            sortDirection,
            rowsPerPage,
        } = mergedState;

        let displayData = (newValues.searchText !== undefined || newValues.filteredData !== undefined || newValues.sortBy !== undefined || newValues.sortDirection !== undefined)
            ? data
            : prevState.displayData;
        let searchMatchers: SearchMatchers | null = !!prevState.searchText ? prevState.searchMatchers : null;

        if (prevState.filteredData !== filteredData || prevState.searchText !== searchText) {
            const filteredIds = _.intersection(displayData.map(row => row.id), ...(filteredData.filter(item => !!item) as TableRowId[][]));
            displayData = displayData.filter(row => filteredIds.includes(row.id));
            
            searchMatchers = {};
            const searchColumns = columns.filter(column => column.searchable);

            displayData = displayData.filter(row => {
                let match = false;
                const matchers: {
                    [columnId: string]: SearchMatcher
                } = {};

                searchColumns.forEach(column => {
                    const value = row.data[column.id];
                    const valueString = column.formatter && !_.isFunction(column.formatter)
                        ? column.formatter.getValueString(value)
                        : _.toString(value);
                    const matcher = Utils.getMatcher(valueString, searchText);

                    if (matcher) {
                        match = true;
                        matchers[column.id] = matcher;
                    }
                });

                if (match) {
                    if (!searchMatchers) {
                        searchMatchers = {};
                    }

                    searchMatchers[row.id] = matchers;
                }

                return match;
            });            
        }

        if ((newValues.sortBy !== undefined || newValues.sortDirection !== undefined) && sortDirection) {
            const sortColumn = _.find(columns, column => column.id === sortBy);
            displayData = _.orderBy(displayData, row => !!sortColumn
                ? sortColumn.dateTime
                    ? Date.parse(_.get(row.data, sortBy))
                    : _.get(row.data, sortBy)
                : '', [sortDirection]);
        }

        return {
            ...mergedState,
            searchMatchers,
            displayData,
            currentPage: mergedState.options.showPagination
                ? Math.min(currentPage, Math.floor(displayData.length / rowsPerPage))
                : 0,
        };
    }

    static getDerivedStateFromProps: GetDerivedStateFromProps<TableProps, TableState> = (nextProps, prevState) => {
        if (prevState && prevState.originalData !== nextProps.data) {
            return MuiTable.getNextState(MuiTable.getInitialState(nextProps), prevState);
        }

        return null;
    }

    state: TableState<T> = MuiTable.defaultState;

    componentDidMount = () => {
        this.updateTableState(MuiTable.getInitialState(this.props));
    }

    updateTableState = (newValues: Partial<TableState<T>>, callback?: (newState: TableState<T>, prevState: TableState<T>) => void) => {
        const onStateChange = this.state.options.onStateChange;
        let prevState: TableState<T>;

        this.setState(currState => {
            prevState = currState;
            return MuiTable.getNextState(newValues, prevState);
        }, () => {
            callback && callback(this.state, prevState);
            onStateChange && onStateChange(this.state, prevState);
        });
    }

    toggleColumn = (columnId: TableColumnId, display?: boolean) => {
        const index = _.findIndex(this.state.columns, column => column.id === columnId);

        if (index !== -1) {
            const columns = [...this.state.columns];

            columns[index] = {
                ...columns[index],
                display: display === undefined ? !columns[index].display : display
            }

            this.updateTableState({
                columns
            });
        }
    }

    toggleRowSelection = (rowId: TableRowId | TableRowId[], select?: boolean) => {
        const onRowSelectionsChange = this.state.options.onRowSelectionsChange;
        const ids = _.isArray(rowId) ? rowId : [rowId];
        const prevRowSelections = this.state.rowSelections;
        const nextRowSelections = this.state.options.multiSelect
            ? Utils.toggleArrayItem(prevRowSelections, ids, select)
            : ids;

        this.updateTableState({
            rowSelections: nextRowSelections
        }, () => onRowSelectionsChange && onRowSelectionsChange(nextRowSelections, prevRowSelections));
    }

    toggleRowExpansion = (rowId: TableRowId | TableRowId[], expand?: boolean) => {
        const onRowExpansionsChange = this.state.options.onRowExpansionsChange;
        const ids = _.isArray(rowId) ? rowId : [rowId];
        const prevRowExpansions = this.state.rowExpansions;
        const nextRowExpansions = this.state.options.multiExpand
            ? Utils.toggleArrayItem(prevRowExpansions, ids, expand)
            : ids;

        this.updateTableState({
            rowExpansions: nextRowExpansions
        }, () => onRowExpansionsChange && onRowExpansionsChange(nextRowExpansions, prevRowExpansions));
    }

    toggleSelectAllRows = (select?: boolean) => {
        const {
            displayData,
            rowSelections,
            options,
        } = this.state;

        const {
            onRowStatus,
            onRowSelectionsChange,
        } = options;

        const enabledRows = displayData.filter((row, index) => {
            if (!onRowStatus) {
                return true;
            }

            const status = onRowStatus(row.id, row.data, index);
            return status ? !status.disabled : true;
        });

        const shouldSelectAll = !_.isBoolean(select)
            ? rowSelections.length !== enabledRows.length
            : !!select;

        const nextRowSelections = shouldSelectAll
            ? _.union(rowSelections, enabledRows.map(row => row.id))
            : [];

        this.updateTableState({
            rowSelections: nextRowSelections
        }, () => onRowSelectionsChange && onRowSelectionsChange(nextRowSelections, rowSelections));
    }

    sortData = (columnId: TableColumnId, direction?: SortDirection) => {
        const {
            sortBy,
            sortDirection,
        } = this.state;

        const newSortDirection = direction !== undefined
            ? direction
            : sortBy !== columnId
                ? 'asc'
                : sortDirection === 'asc'
                    ? 'desc'
                    : sortDirection === 'desc'
                        ? false
                        : 'asc';

        this.updateTableState({
            sortBy: columnId,
            sortDirection: newSortDirection
        });
    }

    changePage = (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => {
        this.updateTableState({
            currentPage: page
        });
    }

    changeRowsPerPage: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (event) => {
        this.updateTableState({
            rowsPerPage: parseInt(event.target.value)
        });
    }

    changeSearch: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (event) => {
        this.updateTableState({
            searchText: event.target.value
        });
    }

    updateFilter = (index: number, ids: TableRowId[] | null) => {
        const filteredData = [...this.state.filteredData];
        filteredData[index] = ids;

        this.updateTableState({
            filteredData
        });
    }

    reorderColumns = (result: DropResult, provided: ResponderProvided) => {
        if (!result.destination) {
            return;
        }

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        this.updateTableState({
            columns: Utils.reorder(this.state.columns, sourceIndex, destinationIndex)
        });
    }

    renderPagination = () => {
        const {
            classes,
        } = this.props;

        const {
            searchText,
            displayData,
            currentPage,
            rowsPerPage,
            options,
        } = this.state;

        const {
            searchable,
            showPagination,
            rowsPerPageOptions,
        } = options;

        return (
            <div className={classes.paginationContainer}>
                {searchable &&
                    <FormControl className={classes.search}>
                        {/* <InputLabel>Search</InputLabel> */}
                        <Input
                            value={searchText}
                            onChange={this.changeSearch}
                            startAdornment={<InputAdornment position="start"><Search /></InputAdornment>}
                            endAdornment={searchText &&
                                <InputAdornment position="end">
                                    <IconButton className={classes.clearSearchButton} onClick={() => this.updateTableState({ searchText: '' })}>
                                        <Clear fontSize="inherit" />
                                    </IconButton>
                                </InputAdornment>
                            } />
                    </FormControl>
                }

                {showPagination &&
                    <TablePagination
                        component="div"
                        count={displayData.length}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={rowsPerPageOptions}
                        page={currentPage}
                        onChangePage={this.changePage}
                        onChangeRowsPerPage={this.changeRowsPerPage}
                        ActionsComponent={TablePaginationActions} />
                }
            </div>
        );
    };

    render() {
        const {
            className,
            classes,            
            title,
            // status,
            headClasses,
            bodyClasses,            
        } = this.props;

        const {
            data,
            displayData,
            columns,
            sortBy,
            sortDirection,
            rowSelections,
            rowExpansions,
            currentPage,
            rowsPerPage,
            searchMatchers,
            options,
        } = this.state;

        const {
            status,
            showBorder,
            showToolbar,
            showHeader,
            stickyHeader,
            showPagination,
            elevation,
            customActions,
            filterComponents,
            customComponents,
            rowExpandComponent,
        } = options as Required<TableOptions<T>>;

        const displayColumns = columns.filter(column => column.display || !column.name);
        const currentPageData = showPagination ? displayData.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage) : displayData;

        return (
            <Paper
                elevation={showBorder ? 0 : elevation}
                className={cx(classes.root, className, {
                    [classes.border]: showBorder
                })}>

                {/* <div className={classes.loader}>
                    <CircularProgress size={40}/>
                </div> */}

                {showToolbar &&
                    <TableToolbar
                        title={title}
                        columns={columns}
                        selectionCount={rowSelections.length}
                        customActions={customActions}
                        onToggleColumn={this.toggleColumn}
                        onDragColumn={this.reorderColumns} />
                }

                {customComponents.length > 0 &&
                    <div className={classes.customComponentsContainer}>
                        {customComponents.map((Component, index) => <Component key={index} {...this.props}/>)}
                    </div>
                }

                {filterComponents.length > 0 &&
                    <div className={classes.filtersContainer}>
                        {filterComponents.map(({ name, field, component: Component }, index) => (
                            <div key={index}>
                                <Typography variant="overline">{name}</Typography>
                                <Component                                    
                                    filterId={index}
                                    filterBy={field}
                                    data={data}
                                    onUpdateFilter={this.updateFilter} />
                            </div>
                        ))}
                    </div>
                }

                {showPagination && this.renderPagination()}

                <DragDropContext onDragEnd={this.reorderColumns}>
                    <Droppable droppableId="droppable" direction="horizontal">
                        {(provided) => (
                            <div
                                className={classes.container}
                                ref={provided.innerRef}
                                {...provided.droppableProps}>

                                <Table
                                    className={classes.table}
                                    size="small"
                                    stickyHeader={stickyHeader}>

                                    {showHeader &&
                                        <TableHead
                                            classes={headClasses}
                                            columns={displayColumns}
                                            options={options}
                                            selectionCount={rowSelections.length}
                                            rowCount={data.length}
                                            sortBy={sortBy}
                                            sortDirection={sortDirection}
                                            onToggleSelectAll={this.toggleSelectAllRows}
                                            onSortData={this.sortData} />
                                    }

                                    <TableBody<T>
                                        classes={bodyClasses}
                                        columns={displayColumns}
                                        data={currentPageData}
                                        options={options}
                                        status={status}
                                        searchMatchers={searchMatchers}
                                        rowCount={showPagination ? rowsPerPage : displayData.length}
                                        rowSelections={rowSelections}
                                        rowExpansions={rowExpansions}
                                        onToggleRowSelection={this.toggleRowSelection} />
                                </Table>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </Paper>
        );
    }
}

// export default withStyles(styles, { name: 'MuiTable' })(MuiTable)

// https://stackoverflow.com/a/52573647
export default class<T = any> extends React.Component<TableProps<T>> {
    private readonly Component = withStyles(styles, { name: 'MuiEnhancedTable' })(
        (props: JSX.LibraryManagedAttributes<typeof MuiTable, MuiTable<T>["props"]>) => <MuiTable<T> {...props} />
    );

    render() {
        return <this.Component {...this.props} />;
    }
}