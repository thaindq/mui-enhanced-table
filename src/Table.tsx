import { Grid, Paper, SortDirection, styled, Table, TablePagination, Box } from '@mui/material';
import clsx from 'clsx';
import {
    debounce,
    find,
    findIndex,
    get,
    intersection,
    isArray,
    isBoolean,
    isEqual,
    isFunction,
    isString,
    orderBy,
    sortBy,
    toString,
    union,
} from 'lodash';
import React, { GetDerivedStateFromProps } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { TableBody } from './components/TableBody';
import { TableHead } from './components/TableHead';
import { TablePaginationActions } from './components/TablePaginationActions';
import { TableSearch } from './components/TableSearch';
import { TableToolbar } from './components/TableToolbar';
import { SearchHighlightedFormatter } from './formatters/SearchHighlightedFormatter';
import {
    SearchMatcher,
    SearchMatchers,
    TableColumn,
    TableColumnId,
    TableOptions,
    TableProps,
    TableRow,
    TableRowId,
    TableState,
} from './types';
import { generateNamesObject, getMatcher, mergeOverwriteArray, reorder, toggleArrayItem } from './utils';

export const muiTableClasses = generateNamesObject(
    [
        'root',
        'container',
        'border',
        'table',
        'topContainer',
        'bottomContainer',
        'searchContainer',
        'paginationContainer',
        'loader',
        'customComponentsContainer',
        'noTitle',
    ],
    'MuiTable',
);

const extraProps = generateNamesObject('showBorder');

const Root = styled(Paper, {
    shouldForwardProp: (prop) => extraProps[prop as keyof typeof extraProps] === undefined,
})<{
    [extraProps.showBorder]?: boolean;
}>(({ theme, showBorder }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    border: showBorder ? `1px solid rgb(110, 110, 110)` : undefined,
    [`& .${muiTableClasses.container}`]: {
        overflowX: 'auto',
        position: 'relative',
        flexGrow: 1,
        // height: '100%'
    },
    [`& .${muiTableClasses.table}`]: {
        position: 'relative',
        display: 'table',
        // height: 'calc(100% - 1px)',
    },
    [`& .${muiTableClasses.topContainer}`]: {
        display: 'flex',
    },
    [`& .${muiTableClasses.searchContainer}`]: {
        paddingLeft: 16,
    },
    [`& .${muiTableClasses.paginationContainer}`]: {
        paddingRight: 16,
        display: 'flex',
        flexShrink: 0,
        '& > *:last-child': {
            flexGrow: 2,
        },
    },
    [`& .${muiTableClasses.loader}`]: {
        top: 0,
        left: 0,
        zIndex: 1000,
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.palette.action.disabledBackground,
        '& ~ *': {
            opacity: 0.25,
        },
    },
    [`& .${muiTableClasses.customComponentsContainer}`]: {
        paddingLeft: 16,
        paddingRight: 16,
    },
    [`& .${muiTableClasses.noTitle}`]: {
        marginTop: -48,
    },
}));

const DEFAULT_STATE: TableState = {
    columns: [],
    rawColumns: [],
    data: [],
    rawData: [],
    status: 'idle',
    isLoading: false,
    isError: false,
    itemCount: 0,
    displayData: [],
    filteredRowIds: {},
    filterData: {},
    selectedRowIds: [],
    expandedRowIds: [],
    sortBy: '',
    sortDirection: false,
    currentPage: 0,
    rowsPerPage: 10,
    searchText: '',
    searchMatchers: null,
    options: {
        noWrap: false,
        sortable: true,
        filterable: true,
        selectable: false,
        expandable: false,
        multiSelect: true,
        multiExpand: true,
        searchable: true,
        showPagination: true,
        rowsPerPageOptions: [10, 20, 40],
        showBorder: false,
        showTitle: true,
        showActions: true,
        showToolbar: true,
        showHeader: true,
        respectDataStatus: true,
        stickyHeader: false,
        allCapsHeader: true,
        highlightRow: true,
        highlightColumn: false,
        alternativeRowColor: true,
        elevation: 1,
        skeletonRows: 3,
        exportable: false,
    },
    rawOptions: {},
};

export const MuiTableContext = React.createContext<TableState>(DEFAULT_STATE);

export class MuiTable<T extends object = any> extends React.Component<TableProps<T>, TableState<T>> {
    static getInitialState = (props: TableProps): TableState => {
        const { data: rawData, dataId, columns: rawColumns, options: rawOptions, dependencies, init } = props;
        const { hiddenColumns } = init || {};

        const options = mergeOverwriteArray({ ...DEFAULT_STATE.options }, rawOptions);

        const data = isFunction(rawData) ? [] : MuiTable.mapDataToTableRow(rawData, dataId);

        const columns = sortBy(MuiTable.prepareTableColumns(rawColumns), (column) => {
            const index = init?.columnOrders?.indexOf(column.id) ?? -1;

            if (index === -1) {
                return Number.MAX_SAFE_INTEGER;
            }

            return index;
        }).map((column) => ({
            ...column,
            display: !hiddenColumns?.length ? column.display : !hiddenColumns.includes(column.id),
        }));

        return {
            ...DEFAULT_STATE,
            ...init,
            dependencies,
            options,
            rawOptions,
            data,
            rawData,
            displayData: data,
            columns,
            rawColumns,
        };
    };

    static getNextState = (newValues: Partial<TableState>, prevState: TableState): TableState => {
        const mergedState = {
            ...prevState,
            ...newValues,
        };

        const { data, columns, filteredRowIds, searchText, sortBy, sortDirection, rowsPerPage, options } = mergedState;

        const hasNewData = newValues.data !== undefined;
        const hasNewSearchText = newValues.searchText !== undefined;
        const hasNewFilteredData = newValues.filteredRowIds !== undefined;
        const hasNewSortBy = newValues.sortBy !== undefined;
        const hasNewSortDirection = newValues.sortDirection !== undefined;

        let searchMatchers: SearchMatchers | null = prevState.searchText ? prevState.searchMatchers : null;
        let currentPage = mergedState.currentPage;
        let displayData = mergedState.displayData;

        if (!isFunction(newValues.rawData) && !isFunction(prevState.rawData)) {
            if (hasNewData || hasNewSearchText || hasNewFilteredData) {
                displayData = data;
                const filteredIds = intersection(
                    displayData.map((row) => row.id),
                    ...(Object.values(filteredRowIds).filter((item) => !!item) as TableRowId[][]),
                );
                displayData = displayData.filter((row) => filteredIds.includes(row.id));

                searchMatchers = {};
                const searchColumns = columns.filter((column) => column.searchable);

                if (searchText) {
                    displayData = displayData.filter((row) => {
                        let match = false;
                        const matchers: {
                            [columnId: string]: SearchMatcher;
                        } = {};

                        searchColumns.forEach((column) => {
                            const value = column.getValue?.(row.data) ?? get(row.data, column.id);
                            const valueString =
                                column.formatter && !isFunction(column.formatter)
                                    ? column.formatter.getValueString(value, row.data)
                                    : toString(value);
                            const matcher = getMatcher(valueString, searchText);

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
            }

            if ((displayData !== prevState.displayData || hasNewSortBy || hasNewSortDirection) && sortDirection) {
                const sortColumn = find(columns, (column) => column.id === sortBy);
                displayData = orderBy(
                    displayData,
                    (row) => {
                        let value = sortColumn?.getValue?.(row.data) ?? get(row.data, sortBy);

                        if (sortColumn?.dateTime) {
                            return Date.parse(value);
                        }

                        if (sortColumn?.sortBy) {
                            value = sortColumn.sortBy(value);
                        }

                        return value;
                    },
                    sortDirection,
                );
            }

            currentPage = options.showPagination
                ? Math.min(currentPage, Math.floor(displayData.length / rowsPerPage))
                : 0;
        }

        return {
            ...mergedState,
            searchMatchers,
            displayData,
            currentPage,
            itemCount: !isFunction(mergedState.rawData) ? displayData.length : mergedState.itemCount,
        };
    };

    static getDerivedStateFromProps: GetDerivedStateFromProps<TableProps, TableState> = (nextProps, prevState) => {
        if (
            !isEqual(prevState.dependencies, nextProps.dependencies) ||
            !isEqual(prevState.rawColumns, nextProps.columns) ||
            !isEqual(prevState.rawOptions, nextProps.options)
        ) {
            return MuiTable.getNextState(MuiTable.getInitialState(nextProps), prevState);
        } else if (prevState && prevState.rawData !== nextProps.data) {
            return MuiTable.getNextState(
                {
                    data: isFunction(nextProps.data)
                        ? []
                        : MuiTable.mapDataToTableRow(nextProps.data, nextProps.dataId),
                    rawData: nextProps.data,
                },
                prevState,
            );
        }

        return null;
    };

    static mapDataToTableRow = <T extends object>(
        data: readonly T[],
        dataId?: TableProps<T>['dataId'],
    ): TableRow<T>[] => {
        return data.map((item, index) => {
            return {
                id: isFunction(dataId) ? dataId(item) : String(dataId ? get(item, dataId, index) : index),
                data: item,
            };
        });
    };

    static prepareTableColumns = <T extends object>(columns: readonly TableColumn<T>[]): TableColumn<T>[] => {
        const seenColumnIds: string[] = [];
        return columns.map((column) => {
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
        });
    };

    state: TableState<T> = DEFAULT_STATE;

    tableId = '';

    componentDidMount = () => {
        this.tableId = `table-${Math.random().toString(36).slice(2, 8)}`;
        this.updateTableState(MuiTable.getInitialState(this.props), undefined, true, true);
    };

    updateTableState = (
        newValues: Partial<TableState<T>>,
        callback?: (newState: TableState<T>, prevState: TableState<T>) => void,
        forceFetchData?: boolean,
        didMount?: boolean,
    ) => {
        let prevState: TableState<T>;

        this.setState(
            (currState) => {
                prevState = currState;

                if (isFunction(this.state.rawData)) {
                    if (
                        forceFetchData ||
                        (newValues.currentPage !== undefined &&
                            !isEqual(newValues.currentPage, currState.currentPage)) ||
                        (newValues.rowsPerPage !== undefined &&
                            !isEqual(newValues.rowsPerPage, currState.rowsPerPage)) ||
                        (newValues.searchText !== undefined && !isEqual(newValues.searchText, currState.searchText)) ||
                        (newValues.sortBy !== undefined && !isEqual(newValues.sortBy, currState.sortBy)) ||
                        (newValues.sortDirection !== undefined &&
                            !isEqual(newValues.sortDirection, currState.sortDirection)) ||
                        (newValues.filterData !== undefined && !isEqual(newValues.filterData, currState.filterData))
                    ) {
                        newValues.status = 'pending';
                        newValues.isLoading = true;
                        newValues.isError = false;
                        this.state
                            .rawData({
                                pageNumber: newValues.currentPage ?? currState.currentPage,
                                pageSize: newValues.rowsPerPage ?? currState.rowsPerPage,
                                searchText: newValues.searchText ?? currState.searchText,
                                sortBy: newValues.sortBy ?? currState.sortBy,
                                sortDirection: newValues.sortDirection ?? currState.sortDirection,
                                filters: newValues.filterData ?? currState.filterData,
                            })
                            .then(({ items, itemCount }) => {
                                const data = MuiTable.mapDataToTableRow(items);
                                this.setState({
                                    status: 'fulfilled',
                                    isLoading: false,
                                    isError: false,
                                    data,
                                    displayData: data,
                                    itemCount,
                                });
                            })
                            .catch(() => {
                                this.setState({
                                    status: 'rejected',
                                    isLoading: false,
                                    isError: true,
                                });
                            });
                    }
                }

                return MuiTable.getNextState(newValues, prevState);
            },
            () => {
                if (!didMount) {
                    callback?.(this.state, prevState);
                    this.props.onStateChange?.(this.state, prevState);
                }
            },
        );
    };

    private shouldFetchData() {
        return isFunction(this.state.rawData);
    }

    toggleColumn = (columnId: TableColumnId, display?: boolean) => {
        const index = findIndex(this.state.columns, (column) => column.id === columnId);

        if (index !== -1) {
            const columns = [...this.state.columns];

            columns[index] = {
                ...columns[index],
                display: display === undefined ? !columns[index].display : display,
            };

            this.updateTableState(
                {
                    columns,
                },
                () => this.props.onColumnsToggle?.(columns.map((column) => column.id)),
            );
        }
    };

    toggleRowSelection = (rowId: TableRowId | TableRowId[], select?: boolean) => {
        const ids = isArray(rowId) ? rowId : [rowId];
        const prevRowSelections = this.state.selectedRowIds;
        const nextRowSelections = this.state.options.multiSelect
            ? toggleArrayItem(prevRowSelections, ids, select)
            : ids;

        this.updateTableState(
            {
                selectedRowIds: nextRowSelections,
            },
            () => {
                const { data, selectedRowIds } = this.state;

                this.props.onRowSelectionsChange?.(
                    nextRowSelections,
                    prevRowSelections,
                    data.filter((item) => selectedRowIds.includes(item.id)).map((item) => item.data),
                );
            },
        );
    };

    toggleRowExpansion = (rowId: TableRowId | TableRowId[], expand?: boolean) => {
        const ids = isArray(rowId) ? rowId : [rowId];
        const prevRowExpansions = this.state.expandedRowIds;
        const nextRowExpansions = this.state.options.multiExpand
            ? toggleArrayItem(prevRowExpansions, ids, expand)
            : prevRowExpansions[0] === rowId
              ? []
              : ids;

        this.updateTableState(
            {
                expandedRowIds: nextRowExpansions,
            },
            () => {
                const { data, expandedRowIds } = this.state;

                this.props.onRowExpansionsChange?.(
                    nextRowExpansions,
                    prevRowExpansions,
                    data.filter((item) => expandedRowIds.includes(item.id)).map((item) => item.data),
                );
            },
        );
    };

    toggleSelectAllRows = (select?: boolean) => {
        const { displayData, selectedRowIds } = this.state;

        const { onRowStatus, onRowSelectionsChange } = this.props;

        const enabledRows = displayData.filter((row, index) => {
            if (!onRowStatus) {
                return true;
            }

            const status = onRowStatus(row.id, row.data, index);
            return status ? !status.disabled : true;
        });

        const shouldSelectAll = !isBoolean(select) ? selectedRowIds.length !== enabledRows.length : !!select;

        const nextRowSelections = shouldSelectAll
            ? union(
                  selectedRowIds,
                  enabledRows.map((row) => row.id),
              )
            : [];

        this.updateTableState(
            {
                selectedRowIds: nextRowSelections,
            },
            () =>
                onRowSelectionsChange?.(
                    nextRowSelections,
                    selectedRowIds,
                    this.state.data.map((item) => item.data),
                ),
        );
    };

    sortData = (columnId: TableColumnId, direction?: SortDirection) => {
        const { sortBy, sortDirection } = this.state;

        const newSortDirection =
            direction !== undefined
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
            sortDirection: newSortDirection,
        });
    };

    changePage = (page: number) => {
        this.updateTableState({
            currentPage: page,
        });
    };

    changeRowsPerPage = (value: number) => {
        this.updateTableState({
            rowsPerPage: value,
        });
    };

    changeSearch = debounce(
        (keyword: string) => {
            this.updateTableState({
                searchText: keyword,
            });
        },
        300,
        { trailing: true },
    );

    updateFilter = (filterId: string, matchedRowIds: TableRowId[] | null, data?: any) => {
        const filteredRowIds = { ...this.state.filteredRowIds };
        filteredRowIds[filterId] = matchedRowIds;

        const filterData = { ...this.state.filterData };
        filterData[filterId] = data;

        this.updateTableState({
            filteredRowIds,
            filterData,
        });
    };

    reorderColumns = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        this.updateTableState({
            columns: reorder(this.state.columns, sourceIndex, destinationIndex),
        });
    };

    resetColumns = () => {
        this.updateTableState(
            {
                columns: MuiTable.prepareTableColumns(this.state.rawColumns),
            },
            () => this.props.onColumnsReset?.(),
        );
    };

    scrollToRow = (rowId: string) => {
        const rowSelector = `[data-row-id="${rowId}"]`;
        const parent = document.querySelector(`#${this.tableId}`);
        const element: HTMLElement | null = document.querySelector(rowSelector);

        if (parent && element) {
            this.scrollParentToChild(parent, element);
        }
    };

    refreshData = () => {
        if (this.shouldFetchData()) {
            this.updateTableState({}, undefined, true);
        }
    };

    // https://stackoverflow.com/a/45411081
    private scrollParentToChild = (parent: Element, child: Element) => {
        // Where is the parent on page
        const parentRect = parent.getBoundingClientRect();

        // What can you see?
        const parentViewableArea = {
            height: parent.clientHeight,
            width: parent.clientWidth,
        };

        // Where is the child
        const childRect = child.getBoundingClientRect();

        // Is the child viewable?
        const isViewable =
            childRect.top >= parentRect.top && childRect.bottom <= parentRect.top + parentViewableArea.height;

        // if you can't see the child try to scroll parent
        if (!isViewable) {
            // Should we scroll using top or bottom? Find the smaller ABS adjustment
            const scrollTop = childRect.top - parentRect.top;
            const scrollBottom = childRect.bottom - parentRect.bottom;

            if (Math.abs(scrollTop) < Math.abs(scrollBottom)) {
                // the child is near the top of the list
                parent.scrollTop += scrollTop - parent.clientHeight / 2;
            } else {
                // the child is near the bottom of the list
                parent.scrollTop += scrollBottom + (parent.clientHeight / 2 - child.clientHeight);
            }
        }
    };

    exportData = () => {
        const { columns, displayData } = this.state;
        const displayColumns = columns.filter((column) => column.display);
        const columnNames = displayColumns.map((column) => column.name);
        const data = displayData.map((item) =>
            displayColumns.map((column) => {
                let value: string = column.getValue?.(item.data) ?? get(item.data, column.id);

                if (value === undefined && column.formatter) {
                    if (isFunction(column.formatter)) {
                        const formattedValue = column.formatter({ value, item: item.data });
                        if (isString(formattedValue)) {
                            value = formattedValue;
                        }
                    } else {
                        value = column.formatter.getValueString(value, item.data);
                    }
                }

                return value;
            }),
        );

        this.props.onDataExport?.([columnNames, ...data]);
    };

    render() {
        const {
            className,
            title,
            components,
            defaultComponentProps,
            icons,
            translations,
            onRowClick,
            onRowSelect,
            onRowExpand,
            onRowStatus,
            onCellClick,
            onCellStatus,
            onNoDataMessage,
            onErrorMessage,
            children,
        } = this.props;

        const {
            data,
            displayData,
            itemCount,
            columns,
            sortBy,
            sortDirection,
            selectedRowIds,
            expandedRowIds,
            currentPage,
            rowsPerPage,
            searchMatchers,
            options,
        } = this.state;

        const {
            showBorder,
            showToolbar,
            showHeader,
            stickyHeader,
            showPagination,
            elevation,
            rowsPerPageOptions,
            searchable,
        } = options as Required<TableOptions>;

        const { rowExpand, rowActions, actions } = components || {};

        const SearchComponent = components?.search || TableSearch;
        const ToolbarComponent = components?.toolbar || TableToolbar;
        const displayColumns = columns.filter((column) => column.display || !column.name);
        const currentPageData =
            this.shouldFetchData() || !showPagination
                ? displayData
                : displayData.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);
        const status = this.shouldFetchData() ? this.state.status : this.props.status;
        const isLoading = this.shouldFetchData() ? this.state.isLoading : this.props.isLoading;
        const isError = this.shouldFetchData() ? this.state.isError : this.props.isError;

        return (
            <MuiTableContext.Provider value={this.state}>
                <Root
                    showBorder={showBorder}
                    elevation={showBorder ? 0 : elevation}
                    className={clsx(muiTableClasses.root, className, {
                        [muiTableClasses.border]: showBorder,
                    })}
                >
                    <Grid container className={muiTableClasses.topContainer}>
                        {showToolbar && (
                            <Grid item xs={12}>
                                <ToolbarComponent
                                    title={title}
                                    columns={columns}
                                    options={options}
                                    translations={translations}
                                    selectionCount={selectedRowIds.length}
                                    actions={actions}
                                    icons={icons}
                                    onColumnToggle={this.toggleColumn}
                                    onColumnDrag={this.reorderColumns}
                                    onColumnsReset={this.resetColumns}
                                    onDataExport={this.exportData}
                                    onDataRefresh={this.shouldFetchData() ? this.refreshData : undefined}
                                />
                            </Grid>
                        )}

                        {children && (
                            <Grid
                                item
                                xs={12}
                                className={clsx(muiTableClasses.customComponentsContainer, {
                                    [muiTableClasses.noTitle]: !title && showToolbar,
                                })}
                            >
                                {isFunction(children)
                                    ? children({
                                          data,
                                          displayData,
                                          onFilterUpdate: (filterId, matchedRowIds, filterData) => {
                                              if (
                                                  this.shouldFetchData() &&
                                                  isEqual(this.state.filterData[filterId], filterData)
                                              ) {
                                                  return;
                                              }

                                              this.updateFilter(
                                                  filterId,
                                                  this.shouldFetchData() ? [] : matchedRowIds,
                                                  filterData,
                                              );
                                          },
                                      })
                                    : children}
                            </Grid>
                        )}

                        <Grid item xs={6} className={muiTableClasses.searchContainer}>
                            {searchable && (
                                <SearchComponent
                                    displayData={displayData}
                                    onChange={this.changeSearch}
                                    TextFieldProps={defaultComponentProps?.SearchProps}
                                />
                            )}
                        </Grid>

                        <Grid item xs={6} className={muiTableClasses.paginationContainer}>
                            {showPagination && (
                                <TablePagination
                                    component="div"
                                    ActionsComponent={(props) => (
                                        <TablePaginationActions
                                            {...props}
                                            icons={icons}
                                            disabled={status === 'pending'}
                                        />
                                    )}
                                    {...defaultComponentProps?.TablePaginationProps}
                                    count={itemCount}
                                    rowsPerPage={rowsPerPage}
                                    rowsPerPageOptions={rowsPerPageOptions}
                                    page={currentPage}
                                    onPageChange={(event, page) => this.changePage(page)}
                                    onRowsPerPageChange={(event) =>
                                        this.changeRowsPerPage(parseInt(event.target.value))
                                    }
                                />
                            )}
                        </Grid>
                    </Grid>

                    <DragDropContext onDragEnd={this.reorderColumns}>
                        <Droppable droppableId="droppable" direction="horizontal">
                            {(provided) => (
                                <Box
                                    id={this.tableId}
                                    className={muiTableClasses.container}
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    <Table size="small" className={muiTableClasses.table} stickyHeader={stickyHeader}>
                                        {showHeader && (
                                            <TableHead
                                                columns={displayColumns}
                                                options={options}
                                                selectionCount={selectedRowIds.length}
                                                rowCount={data.length}
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                hasRowActions={!!rowActions}
                                                onToggleSelectAll={this.toggleSelectAllRows}
                                                onSortData={this.sortData}
                                            />
                                        )}

                                        <TableBody<T>
                                            columns={displayColumns}
                                            data={data}
                                            displayData={currentPageData}
                                            options={{
                                                ...options,
                                                respectDataStatus: this.shouldFetchData()
                                                    ? true
                                                    : options.respectDataStatus,
                                            }}
                                            status={status}
                                            isLoading={isLoading}
                                            isError={isError}
                                            searchMatchers={searchMatchers}
                                            rowCount={showPagination ? rowsPerPage : displayData.length}
                                            selectedRowIds={selectedRowIds}
                                            expandedRowIds={expandedRowIds}
                                            rowActions={rowActions}
                                            rowExpand={rowExpand}
                                            onToggleRowSelection={this.toggleRowSelection}
                                            onToggleRowExpansion={this.toggleRowExpansion}
                                            onRowClick={onRowClick}
                                            onRowStatus={onRowStatus}
                                            onRowExpand={onRowExpand}
                                            onRowSelect={onRowSelect}
                                            onCellClick={onCellClick}
                                            onCellStatus={onCellStatus}
                                            onNoDataMessage={onNoDataMessage}
                                            onErrorMessage={onErrorMessage}
                                        />
                                    </Table>
                                </Box>
                            )}
                        </Droppable>
                    </DragDropContext>
                </Root>
            </MuiTableContext.Provider>
        );
    }
}

export default MuiTable;
