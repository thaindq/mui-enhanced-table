import { createStyles, FormControl, IconButton, Input, InputAdornment, Paper, SortDirection, Table, TablePagination, Theme, Typography, withStyles, createMuiTheme, MuiThemeProvider, CircularProgress } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import { WithStyles } from '@material-ui/styles';
import cx from 'classnames';
import _ from 'lodash';
import React, { GetDerivedStateFromProps } from 'react';
import { DragDropContext, Droppable, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import { SearchMatcher, SearchMatchers, TableColumnId, TableProps, TableRowId, TableState, TableOptions, TableInitData, TableRow } from '../types';
import TableBody from './components/TableBody';
import TableHead from './components/TableHead';
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
        position: 'relative',
        // height: '100%'
    },
    border: {
        border: `1px solid rgb(110, 110, 110)`
    },
    table: {
        position: 'relative',
        display: 'table',
        height: 'calc(100% - 1px)',
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
        }
    },
    customComponentsContainer: {
        paddingLeft: 16,
        paddingRight: 8,
    },
    filtersContainer: {
        paddingLeft: 16,
        paddingRight: 8
    },
    noTitle: {
        marginTop: -48
    }
});

class MuiTable<T = any> extends React.Component<TableProps<T> & WithStyles<typeof styles>, TableState<T>> {
    static defaultProps: Partial<TableProps> = {
        className: '',
        title: '',
        headClasses: {},
        bodyClasses: {},
        dataId: '',
        status: 'Idle',
        init: {},
        options: {},
        components: {},
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
            showToolbar: true,
            showHeader: true,
            stickyHeader: false,
            allCapsHeader: true,
            highlightRow: true,
            highlightColumn: false,
            alternativeRowColor: true,
            elevation: 1,
        }
    };

    static getInitialState = (props: TableProps): TableState => {
        const {
            data,
            dataId,
            columns,
            init,
            options,
            dependencies
        } = props;

        const mergedOptions = {
            ...MuiTable.defaultState.options,
            ...options,
        }

        const seenColumnIds: string[] = [];
        const tableData = MuiTable.mapDataToTableRow(data, dataId);

        return {
            ...MuiTable.defaultState,
            ...init,
            dependencies,
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
            options,
        } = mergedState;

        const hasNewData = newValues.data !== undefined;
        const hasNewSearchText = newValues.searchText !== undefined;
        const hasNewFilteredData = newValues.filteredData !== undefined;
        const hasNewSortBy = newValues.sortBy !== undefined;
        const hasNewSortDirection = newValues.sortDirection !== undefined;

        let displayData = (hasNewData || hasNewSearchText || hasNewFilteredData || hasNewSortBy || hasNewSortDirection)
            ? data
            : prevState.displayData;
        let searchMatchers: SearchMatchers | null = !!prevState.searchText ? prevState.searchMatchers : null;

        if (hasNewData || prevState.filteredData !== filteredData || prevState.searchText !== searchText) {
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

        if ((hasNewData || hasNewSortBy || hasNewSortDirection) && sortDirection) {
            const sortColumn = _.find(columns, column => column.id === sortBy);
            displayData = _.orderBy(displayData, row => sortColumn?.dateTime ? Date.parse(_.get(row.data, sortBy)) : _.get(row.data, sortBy), sortDirection);
        }

        return {
            ...mergedState,
            searchMatchers,
            displayData,
            currentPage: options.showPagination
                ? Math.min(currentPage, Math.floor(displayData.length / rowsPerPage))
                : 0,
        };
    }

    static getDerivedStateFromProps: GetDerivedStateFromProps<TableProps, TableState> = (nextProps, prevState) => {
        if (!_.isEqual(prevState.dependencies, nextProps.dependencies)) {
            return MuiTable.getNextState(MuiTable.getInitialState(nextProps), prevState);
        } else if (prevState && prevState.originalData !== nextProps.data) {
            return MuiTable.getNextState({
                data: MuiTable.mapDataToTableRow(nextProps.data, nextProps.dataId),
                originalData: nextProps.data,
            }, prevState);
        }

        return null;
    }

    static mapDataToTableRow = <T extends {}>(data: readonly T[], dataId?: string): TableRow<T>[] => {
        return data.map((item, index) => {
            return {
                id: String(!!dataId ? _.get(item, dataId, index) : index),
                data: item,
            };
        });
    }

    state: TableState<T> = MuiTable.defaultState;

    componentDidMount = () => {
        this.updateTableState(MuiTable.getNextState(MuiTable.getInitialState(this.props), MuiTable.defaultState));
    }

    updateTableState = (newValues: Partial<TableState<T>>, callback?: (newState: TableState<T>, prevState: TableState<T>) => void) => {
        let prevState: TableState<T>;

        this.setState(currState => {
            prevState = currState;
            return MuiTable.getNextState(newValues, prevState);
        }, () => {
            callback?.(this.state, prevState);
            this.props.onStateChange?.(this.state, prevState);
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
        const ids = _.isArray(rowId) ? rowId : [rowId];
        const prevRowSelections = this.state.rowSelections;
        const nextRowSelections = this.state.options.multiSelect
            ? Utils.toggleArrayItem(prevRowSelections, ids, select)
            : ids;

        this.updateTableState({
            rowSelections: nextRowSelections
        }, () => this.props.onRowSelectionsChange?.(nextRowSelections, prevRowSelections));
    }

    toggleRowExpansion = (rowId: TableRowId | TableRowId[], expand?: boolean) => {
        const ids = _.isArray(rowId) ? rowId : [rowId];
        const prevRowExpansions = this.state.rowExpansions;
        const nextRowExpansions = this.state.options.multiExpand
            ? Utils.toggleArrayItem(prevRowExpansions, ids, expand)
            : ids;

        this.updateTableState({
            rowExpansions: nextRowExpansions
        }, () => this.props.onRowExpansionsChange?.(nextRowExpansions, prevRowExpansions));
    }

    toggleSelectAllRows = (select?: boolean) => {
        const {
            displayData,
            rowSelections,
        } = this.state;

        const {
            onRowStatus,
            onRowSelectionsChange,
        } = this.props;

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
        }, () => onRowSelectionsChange?.(nextRowSelections, rowSelections));
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
            status,
            headClasses,
            bodyClasses,
            components,
            onRowClick,
            onRowSelect,
            onRowExpand,
            onRowSelectionsChange,
            onRowExpansionsChange,
            onRowStatus,
            onCellClick,
            onCellStatus,
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
            showBorder,
            showToolbar,
            showHeader,
            stickyHeader,
            showPagination,
            elevation,
        } = options as Required<TableOptions<T>>;

        const {
            filters,
            customs,
            rowExpand,
            rowActions,
            actions,
        } = components || {};

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
                        actions={actions}
                        onToggleColumn={this.toggleColumn}
                        onDragColumn={this.reorderColumns} />
                }

                {customs && customs.length > 0 &&
                    <div className={cx(classes.customComponentsContainer, { [classes.noTitle]: !title })}>
                        {customs.map((Component, index) => <Component key={index} {...this.props} />)}
                    </div>
                }

                {filters && filters.length > 0 &&
                    <div className={cx(classes.filtersContainer, { [classes.noTitle]: !title })}>
                        {filters.map(({ name, field, component: Component }, index) => (
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
                                    size="small"
                                    className={classes.table}
                                    stickyHeader={stickyHeader}
                                >

                                    {showHeader &&
                                        <TableHead
                                            classes={headClasses}
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
                                        rowActions={rowActions}
                                        rowExpand={rowExpand}
                                        onToggleRowSelection={this.toggleRowSelection}
                                        onRowClick={onRowClick}
                                        onRowStatus={onRowStatus}
                                        onRowExpand={onRowExpand}
                                        onRowSelect={onRowSelect}
                                        onCellClick={onCellClick}
                                        onCellStatus={onCellStatus}
                                    />
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
export default class <T = any> extends React.Component<TableProps<T> & Partial<WithStyles<typeof styles>>> {
    private readonly Component = withStyles(styles, { name: 'MuiEnhancedTable' })(
        (props: JSX.LibraryManagedAttributes<typeof MuiTable, MuiTable<T>["props"]>) => <MuiTable<T> {...props} />
    );

    render() {
        return <this.Component {...this.props} />;
    }
}