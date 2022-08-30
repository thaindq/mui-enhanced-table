import { Grid, Paper, SortDirection, styled, Table, TablePagination } from '@mui/material';
import { Box } from '@mui/system';
import cx from 'classnames';
import {
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
        'bottomCustomComponentsContainer',
        'filtersContainer',
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
        height: 'calc(100% - 1px)',
    },
    [`& .${muiTableClasses.topContainer}`]: {
        display: 'flex',
    },
    [`& .${muiTableClasses.searchContainer}`]: {},
    [`& .${muiTableClasses.paginationContainer}`]: {
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
        paddingRight: 8,
    },
    [`& .${muiTableClasses.bottomCustomComponentsContainer}`]: {
        paddingLeft: 16,
        paddingRight: 8,
    },
    [`& .${muiTableClasses.filtersContainer}`]: {
        paddingLeft: 16,
        paddingRight: 16,
    },
    [`& .${muiTableClasses.noTitle}`]: {
        marginTop: -48,
    },
}));

export class MuiTable<T = any> extends React.Component<TableProps<T>, TableState<T>> {
    static defaultProps: Partial<TableProps> = {
        className: '',
        title: '',
        dataId: 'id',
        status: 'idle',
        init: {},
        options: {},
        components: {},
    };

    static defaultState: TableState = {
        columns: [],
        originalColumns: [],
        data: [],
        originalData: [],
        displayData: [],
        filteredData: [],
        rowSelections: [],
        rowExpansions: [],
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
        },
    };

    static getInitialState = (props: TableProps): TableState => {
        const { data: rawData, dataId, columns: rawColumns, init, options, dependencies } = props;

        const mergedOptions = mergeOverwriteArray({ ...MuiTable.defaultState.options }, options);

        const seenColumnIds: string[] = [];
        const data = MuiTable.mapDataToTableRow(rawData, dataId);
        const originalColumns = rawColumns.map((column) => {
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

        const columns = sortBy(originalColumns, (column) => {
            const index = init?.columnOrders?.indexOf(column.id) ?? -1;

            if (index === -1) {
                return Number.MAX_SAFE_INTEGER;
            }

            return index;
        }).map((column) => ({
            ...column,
            display: init?.hiddenColumns?.includes(column.id) ? false : column.display,
        }));

        return {
            ...MuiTable.defaultState,
            ...init,
            dependencies,
            options: mergedOptions,
            originalData: data,
            data,
            displayData: data,
            columns,
            originalColumns,
        };
    };

    static getNextState = (newValues: Partial<TableState>, prevState: TableState): TableState => {
        const mergedState = {
            ...prevState,
            ...newValues,
        };

        const { data, columns, filteredData, searchText, currentPage, sortBy, sortDirection, rowsPerPage, options } =
            mergedState;

        const hasNewData = newValues.data !== undefined;
        const hasNewSearchText = newValues.searchText !== undefined;
        const hasNewFilteredData = newValues.filteredData !== undefined;
        const hasNewSortBy = newValues.sortBy !== undefined;
        const hasNewSortDirection = newValues.sortDirection !== undefined;

        let displayData = prevState.displayData;
        let searchMatchers: SearchMatchers | null = prevState.searchText ? prevState.searchMatchers : null;

        if (hasNewData || hasNewSearchText || hasNewFilteredData) {
            displayData = data;
            const filteredIds = intersection(
                displayData.map((row) => row.id),
                ...(filteredData.filter((item) => !!item) as TableRowId[][]),
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

        if (options.dataLimit) {
            displayData = displayData.slice(0, options.dataLimit);
        }

        return {
            ...mergedState,
            searchMatchers,
            displayData,
            currentPage: options.showPagination
                ? Math.min(currentPage, Math.floor(displayData.length / rowsPerPage))
                : 0,
        };
    };

    static getDerivedStateFromProps: GetDerivedStateFromProps<TableProps, TableState> = (nextProps, prevState) => {
        if (!isEqual(prevState.dependencies, nextProps.dependencies)) {
            return MuiTable.getNextState(MuiTable.getInitialState(nextProps), prevState);
        } else if (prevState && prevState.originalData !== nextProps.data) {
            return MuiTable.getNextState(
                {
                    data: MuiTable.mapDataToTableRow(nextProps.data, nextProps.dataId),
                    originalData: nextProps.data,
                },
                prevState,
            );
        }

        return null;
    };

    static mapDataToTableRow = <T extends {}>(data: readonly T[], dataId?: TableProps<T>['dataId']): TableRow<T>[] => {
        return data.map((item, index) => {
            return {
                id: isFunction(dataId) ? dataId(item) : String(dataId ? get(item, dataId, index) : index),
                data: item,
            };
        });
    };

    state: TableState<T> = MuiTable.defaultState;

    tableId = '';

    componentDidMount = () => {
        this.tableId = `table-${Math.random().toString(36).slice(2, 8)}`;
        this.updateTableState(MuiTable.getNextState(MuiTable.getInitialState(this.props), MuiTable.defaultState));
    };

    updateTableState = (
        newValues: Partial<TableState<T>>,
        callback?: (newState: TableState<T>, prevState: TableState<T>) => void,
    ) => {
        let prevState: TableState<T>;

        this.setState(
            (currState) => {
                prevState = currState;
                return MuiTable.getNextState(newValues, prevState);
            },
            () => {
                callback?.(this.state, prevState);
                this.props.onStateChange?.(this.state, prevState);
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

            this.updateTableState({
                columns,
            });
        }
    };

    toggleRowSelection = (rowId: TableRowId | TableRowId[], select?: boolean) => {
        const ids = isArray(rowId) ? rowId : [rowId];
        const prevRowSelections = this.state.rowSelections;
        const nextRowSelections = this.state.options.multiSelect
            ? toggleArrayItem(prevRowSelections, ids, select)
            : ids;

        this.updateTableState(
            {
                rowSelections: nextRowSelections,
            },
            () => {
                const { data, rowSelections } = this.state;

                this.props.onRowSelectionsChange?.(
                    nextRowSelections,
                    prevRowSelections,
                    data.filter((item) => rowSelections.includes(item.id)).map((item) => item.data),
                );
            },
        );
    };

    toggleRowExpansion = (rowId: TableRowId | TableRowId[], expand?: boolean) => {
        const ids = isArray(rowId) ? rowId : [rowId];
        const prevRowExpansions = this.state.rowExpansions;
        const nextRowExpansions = this.state.options.multiExpand
            ? toggleArrayItem(prevRowExpansions, ids, expand)
            : prevRowExpansions[0] === rowId
            ? []
            : ids;

        this.updateTableState(
            {
                rowExpansions: nextRowExpansions,
            },
            () => {
                const { data, rowExpansions } = this.state;

                this.props.onRowExpansionsChange?.(
                    nextRowExpansions,
                    prevRowExpansions,
                    data.filter((item) => rowExpansions.includes(item.id)).map((item) => item.data),
                );
            },
        );
    };

    toggleSelectAllRows = (select?: boolean) => {
        const { displayData, rowSelections } = this.state;

        const { onRowStatus, onRowSelectionsChange } = this.props;

        const enabledRows = displayData.filter((row, index) => {
            if (!onRowStatus) {
                return true;
            }

            const status = onRowStatus(row.id, row.data, index);
            return status ? !status.disabled : true;
        });

        const shouldSelectAll = !isBoolean(select) ? rowSelections.length !== enabledRows.length : !!select;

        const nextRowSelections = shouldSelectAll
            ? union(
                  rowSelections,
                  enabledRows.map((row) => row.id),
              )
            : [];

        this.updateTableState(
            {
                rowSelections: nextRowSelections,
            },
            () =>
                onRowSelectionsChange?.(
                    nextRowSelections,
                    rowSelections,
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

    changeSearch = (keyword: string) => {
        this.updateTableState({
            searchText: keyword,
        });
    };

    updateFilter = (index: number, ids: TableRowId[] | null) => {
        const filteredData = [...this.state.filteredData];
        filteredData[index] = ids;

        this.updateTableState({
            filteredData,
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
        this.updateTableState({
            columns: this.state.originalColumns,
        });
    };

    scrollToRow = (rowId: string) => {
        const rowSelector = `[data-row-id="${rowId}"]`;
        const parent = document.querySelector(`#${this.tableId}`);
        const element: HTMLElement | null = document.querySelector(rowSelector);

        if (parent && element) {
            this.scrollParentToChild(parent, element);
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
            status,
            components,
            defaultComponentProps,
            icons,
            onRowClick,
            onRowSelect,
            onRowExpand,
            onRowStatus,
            onCellClick,
            onCellStatus,
            onNoDataMessage,
            onErrorMessage,
        } = this.props;

        const {
            data,
            displayData,
            columns,
            sortBy,
            sortDirection,
            searchText,
            rowSelections,
            rowExpansions,
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
            component,
        } = options as Required<TableOptions>;

        const { filters, customs, customsBottom, rowExpand, rowActions, actions } = components || {};

        const SearchComponent = components?.search || TableSearch;
        const ToolbarComponent = components?.toolbar || TableToolbar;
        const displayColumns = columns.filter((column) => column.display || !column.name);
        const currentPageData = showPagination
            ? displayData.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage)
            : displayData;

        return (
            <Root
                showBorder={showBorder}
                elevation={showBorder ? 0 : elevation}
                className={cx(muiTableClasses.root, className, {
                    [muiTableClasses.border]: showBorder,
                })}
            >
                {/* <div className={classes.loader}>
                    <CircularProgress size={40}/>
                </div> */}

                <Grid container className={muiTableClasses.topContainer}>
                    {showToolbar && (
                        <Grid item xs={12}>
                            <ToolbarComponent
                                title={title}
                                columns={columns}
                                options={options}
                                selectionCount={rowSelections.length}
                                actions={actions}
                                icons={icons}
                                onColumnToggle={this.toggleColumn}
                                onColumnDrag={this.reorderColumns}
                                onColumnsReset={this.resetColumns}
                                onDataExport={this.exportData}
                            />
                        </Grid>
                    )}

                    {customs && customs.length > 0 && (
                        <Grid
                            item
                            xs={12}
                            className={cx(muiTableClasses.customComponentsContainer, {
                                [muiTableClasses.noTitle]: !title && showToolbar,
                            })}
                        >
                            {customs.map((Component, index) => (
                                <Component key={index} {...this.props} />
                            ))}
                        </Grid>
                    )}

                    {filters && filters.length > 0 && (
                        <Grid
                            item
                            xs={12}
                            className={cx(muiTableClasses.filtersContainer, { [muiTableClasses.noTitle]: !title })}
                        >
                            {filters.map(({ name, field, component: Component }, index) => (
                                <Component
                                    key={index}
                                    name={name}
                                    filterBy={field}
                                    data={data}
                                    displayData={displayData}
                                    onUpdateFilter={(ids) => this.updateFilter(index, ids)}
                                />
                            ))}
                        </Grid>
                    )}

                    <Grid item xs={6} className={muiTableClasses.searchContainer}>
                        {searchable && (
                            <SearchComponent
                                searchText={searchText}
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
                                count={displayData.length}
                                rowsPerPage={rowsPerPage}
                                rowsPerPageOptions={rowsPerPageOptions}
                                page={currentPage}
                                onPageChange={(event, page) => this.changePage(page)}
                                onRowsPerPageChange={(event) => this.changeRowsPerPage(parseInt(event.target.value))}
                                ActionsComponent={(props) => <TablePaginationActions {...props} icons={icons} />}
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
                                <Table
                                    size="small"
                                    className={muiTableClasses.table}
                                    stickyHeader={stickyHeader}
                                    component={component}
                                >
                                    {showHeader && (
                                        <TableHead
                                            columns={displayColumns}
                                            options={options}
                                            selectionCount={rowSelections.length}
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
                                        status={status}
                                        searchMatchers={searchMatchers}
                                        rowCount={showPagination ? rowsPerPage : displayData.length}
                                        rowSelections={rowSelections}
                                        rowExpansions={rowExpansions}
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

                {customsBottom && customsBottom.length > 0 && (
                    <Box
                        className={cx(muiTableClasses.bottomCustomComponentsContainer, {
                            [muiTableClasses.noTitle]: !title && showToolbar,
                        })}
                    >
                        {customsBottom.map((Component, index) => (
                            <Component key={index} {...this.props} />
                        ))}
                    </Box>
                )}
            </Root>
        );
    }
}

export default MuiTable;
