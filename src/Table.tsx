import {
    alpha,
    Box,
    CircularProgress,
    Grid,
    Paper,
    SortDirection,
    styled,
    Table,
    TablePagination,
    Toolbar,
} from '@mui/material';
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
    orderBy,
    sortBy,
    toString,
    union,
} from 'lodash';
import React, { GetDerivedStateFromProps } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { SetRequired } from 'type-fest';
import { TableBody } from './components/TableBody';
import { TableHead } from './components/TableHead';
import { TablePaginationActions } from './components/TablePaginationActions';
import { TableSearch } from './components/TableSearch';
import { MuiTableToolbar } from './components/TableToolbar';
import { SearchHighlightedFormatter } from './formatters/SearchHighlightedFormatter';
import {
    DataQuery,
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
import {
    generateNamesObject,
    getMatcher,
    isBackendData,
    isLocalData,
    mergeOverwriteArray,
    reorder,
    toggleArrayItem,
} from './utils';

export const muiTableClasses = generateNamesObject(
    [
        'root',
        'border',
        'container',
        'table',
        'componentsContainer',
        'bottomContainer',
        'customComponentsContainer',
        'noTitle',
    ],
    'MuiTable',
);

const Root = styled(Paper)(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    [`&.${muiTableClasses.border}`]: {
        border: `1px solid ${theme.palette.action.active}`,
    },
    [`& .${muiTableClasses.container}`]: {
        overflowX: 'auto',
        position: 'relative',
        flexGrow: 1,
    },
    [`& .${muiTableClasses.componentsContainer}`]: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    [`& .${muiTableClasses.noTitle}`]: {
        marginTop: `-${theme.spacing(6)}`,
    },
}));

const DEFAULT_STATE: TableState = {
    columns: [],
    rawColumns: [],
    data: [],
    rawData: [],
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
        stickyHeader: false,
        allCapsHeader: true,
        highlightRow: true,
        highlightColumn: false,
        alternativeRowColor: true,
        elevation: 1,
        skeletonRows: 5,
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

        const data = MuiTable.mapDataToTableRow(rawData, dataId);

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

    static getNextState = (
        newStateValues: Partial<TableState>,
        prevState: TableState,
    ): {
        nextState: TableState;
        nextQuery?: DataQuery;
    } => {
        const mergedState = {
            ...prevState,
            ...newStateValues,
        };

        const { columns, filteredRowIds, searchText, sortBy, sortDirection, rowsPerPage, options } = mergedState;

        const hasNewData = newStateValues.data !== undefined;
        const hasNewPage = newStateValues.currentPage !== undefined;
        const hasNewRowsPerPage = newStateValues.rowsPerPage !== undefined;
        const hasNewSearchText = newStateValues.searchText !== undefined;
        const hasNewSortBy = newStateValues.sortBy !== undefined;
        const hasNewSortDirection = newStateValues.sortDirection !== undefined;
        const hasNewFilteredData = newStateValues.filteredRowIds !== undefined;

        const hasNewQuery =
            hasNewPage ||
            hasNewRowsPerPage ||
            hasNewSearchText ||
            hasNewSortBy ||
            hasNewSortDirection ||
            hasNewFilteredData;

        let searchMatchers: SearchMatchers | null = prevState.searchText ? prevState.searchMatchers : null;
        let displayData = mergedState.data;
        let currentPage = isBackendData(mergedState.rawData)
            ? mergedState.rawData.currentPage
            : mergedState.currentPage;

        if (isLocalData(mergedState.rawData)) {
            if (hasNewData || hasNewSearchText || hasNewFilteredData) {
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
                            const value = column.getValue(row.data);
                            const valueString = toString(value);
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
                        let value = sortColumn?.getValue(row.data);

                        if (sortColumn?.dateTime) {
                            return Date.parse(value);
                        }

                        if (sortColumn?.getSortValue) {
                            value = sortColumn.getSortValue(value);
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

        const nextState = {
            ...mergedState,
            searchMatchers,
            displayData,
            currentPage,
            itemCount: isBackendData(mergedState.rawData)
                ? mergedState.rawData.itemCount
                : isLocalData(mergedState.rawData)
                  ? displayData.length
                  : mergedState.itemCount,
        };

        return {
            nextState,
            nextQuery:
                hasNewQuery && !isLocalData(mergedState.rawData)
                    ? {
                          pageNumber: mergedState.currentPage,
                          pageSize: mergedState.rowsPerPage,
                          searchText: mergedState.searchText,
                          sortBy: mergedState.sortBy,
                          sortDirection: mergedState.sortDirection,
                          filters: mergedState.filterData,
                      }
                    : undefined,
        };
    };

    static getDerivedStateFromProps: GetDerivedStateFromProps<TableProps, TableState> = (nextProps, prevState) => {
        if (
            !isEqual(prevState.dependencies, nextProps.dependencies) ||
            !isEqual(prevState.rawColumns, nextProps.columns) ||
            !isEqual(prevState.rawOptions, nextProps.options)
        ) {
            return MuiTable.getNextState(MuiTable.getInitialState(nextProps), prevState).nextState;
        } else if (prevState && prevState.rawData !== nextProps.data) {
            return MuiTable.getNextState(
                {
                    data: MuiTable.mapDataToTableRow(nextProps.data, nextProps.dataId),
                    rawData: nextProps.data,
                },
                prevState,
            ).nextState;
        }

        return null;
    };

    static mapDataToTableRow = <T extends object>(
        data: TableProps<T>['data'],
        dataId?: TableProps<T>['dataId'],
    ): TableRow<T>[] => {
        const finalData = isLocalData(data) ? data : isBackendData(data) ? data.items : [];
        return finalData.map((item, index) => {
            return {
                id: isFunction(dataId) ? dataId(item) : String(dataId ? get(item, dataId, index) : index),
                data: item,
            };
        });
    };

    static prepareTableColumns = <T extends object>(
        columns: readonly TableColumn<T>[],
    ): SetRequired<TableColumn<T>, 'getValue'>[] => {
        const seenColumnIds: string[] = [];
        return columns.map((column) => {
            const {
                id,
                name = '',
                display = true,
                sortable = true,
                filterable = true,
                searchable = true,
                getValue = (item: T) => get(item, column.id),
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
                getValue,
                formatter,
                ...rest,
            };
        });
    };

    state: TableState<T> = DEFAULT_STATE;

    tableId = '';

    componentDidMount = () => {
        this.tableId = `table-${Math.random().toString(36).slice(2, 8)}`;
        this.updateTableState(MuiTable.getInitialState(this.props) as TableState<T>, undefined, true);
    };

    updateTableState = (
        newValues: Partial<TableState<T>>,
        callback?: (newState: TableState<T>, prevState: TableState<T>) => void,
        didMount?: boolean,
    ) => {
        let prevStateForCallback: TableState<T>;
        let nextQueryForCallback: DataQuery | undefined;

        this.setState(
            (prevState) => {
                const { nextState, nextQuery } = MuiTable.getNextState(newValues, prevState);
                prevStateForCallback = prevState;
                nextQueryForCallback = nextQuery;
                return nextState;
            },
            () => {
                if (!didMount) {
                    callback?.(this.state, prevStateForCallback);
                    this.props.onStateChange?.(this.state, prevStateForCallback);
                }

                if (nextQueryForCallback) {
                    this.fetchData(nextQueryForCallback);
                }
            },
        );
    };

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

    fetchData = (newQuery?: DataQuery) => {
        const { rawData, currentPage, rowsPerPage, searchText, sortBy, sortDirection, filterData } = this.state;
        const query = newQuery ?? {
            pageNumber: currentPage,
            pageSize: rowsPerPage,
            searchText,
            sortBy,
            sortDirection,
            filters: filterData,
        };

        if (isLocalData(rawData)) {
            return;
        } else if (isBackendData(rawData)) {
            this.props.onDataQuery?.(query);
        } else {
            this.setState({
                isLoading: true,
                isError: false,
            });

            (rawData as Exclude<typeof rawData, readonly any[]>)(query)
                .then(({ items, itemCount, currentPage }) => {
                    const data = MuiTable.mapDataToTableRow(items);
                    this.setState({
                        isLoading: false,
                        isError: false,
                        data,
                        displayData: data,
                        itemCount,
                        currentPage,
                    });
                })
                .catch(() => {
                    this.setState({
                        isLoading: false,
                        isError: true,
                    });
                });
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
                const value: string = column.getValue(item.data);
                return toString(value);
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
            rawData,
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
            isLoading,
            isError,
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

        const { rowExpand, rowActions, actions, selectActions } = components || {};

        const SearchComponent = components?.search || TableSearch;
        const ToolbarComponent = components?.toolbar || MuiTableToolbar;
        const PaginationComponent = components?.pagination || TablePagination;

        const displayColumns = columns.filter((column) => column.display || !column.name);
        const currentPageData =
            isLocalData(rawData) && showPagination
                ? displayData.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage)
                : displayData;

        return (
            <MuiTableContext.Provider value={this.state}>
                <Root
                    elevation={showBorder ? 0 : elevation}
                    className={clsx(muiTableClasses.root, className, {
                        [muiTableClasses.border]: showBorder,
                    })}
                >
                    {showToolbar && (
                        <ToolbarComponent
                            title={title}
                            columns={columns}
                            options={options}
                            translations={translations}
                            selectionCount={selectedRowIds.length}
                            actions={actions}
                            selectActions={selectActions}
                            icons={icons}
                            onColumnToggle={this.toggleColumn}
                            onColumnDrag={this.reorderColumns}
                            onColumnsReset={this.resetColumns}
                            onDataExport={this.exportData}
                            onDataRefresh={() => this.fetchData()}
                        />
                    )}

                    <Toolbar disableGutters>
                        <Grid container className={muiTableClasses.componentsContainer} width={'100%'}>
                            {children && (
                                <Grid
                                    xs={12}
                                    className={clsx(muiTableClasses.customComponentsContainer, {
                                        [muiTableClasses.noTitle]: !title && showToolbar,
                                    })}
                                >
                                    {isFunction(children)
                                        ? children({
                                              data,
                                              displayData,
                                              onFilterUpdate: this.updateFilter,
                                          })
                                        : children}
                                </Grid>
                            )}

                            <Grid xs={12} md={5} xl={4}>
                                {searchable && (
                                    <SearchComponent displayData={displayData} onChange={this.changeSearch} />
                                )}
                            </Grid>

                            <Grid xs={12} md={7} xl={8}>
                                {showPagination && (
                                    <PaginationComponent
                                        component="div"
                                        ActionsComponent={(props) => (
                                            <TablePaginationActions {...props} icons={icons} disabled={isLoading} />
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
                    </Toolbar>

                    <DragDropContext onDragEnd={this.reorderColumns}>
                        <Droppable droppableId="droppable" direction="horizontal">
                            {(provided) => (
                                <Box
                                    id={this.tableId}
                                    className={muiTableClasses.container}
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    <Table className={muiTableClasses.table} stickyHeader={stickyHeader}>
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
                                            options={options}
                                            isLoading={isLoading}
                                            isError={isError}
                                            searchMatchers={searchMatchers}
                                            rowCount={showPagination ? rowsPerPage : displayData.length}
                                            selectedRowIds={selectedRowIds}
                                            expandedRowIds={expandedRowIds}
                                            rowActions={rowActions}
                                            rowExpand={rowExpand}
                                            translations={translations}
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
