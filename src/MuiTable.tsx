import { createStyles, FormControl, IconButton, Input, InputAdornment, Paper, SortDirection, Table, TablePagination, Theme, withStyles } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import { WithStyles, PropsOfStyles } from '@material-ui/styles';
import cx from 'classnames';
import _ from 'lodash';
import React, { GetDerivedStateFromProps } from 'react';
import { DragDropContext, Droppable, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import { SearchMatcher, SearchMatchers, TableColumnId, TableOptions, TableProps, TableRowId, TableState } from '../types';
import TableBody from './components/TableBody';
import TableHead from './components/TableHead';
import TablePaginationActions from './components/TablePaginationActions';
import TableToolbar from './components/TableToolbar';
import Utils from './utils';
import { PropsFor } from '@material-ui/system';
import SearchHighlightedFormatter from './formatters/SearchHighlightedFormatter';

const styles = (theme: Theme) => createStyles({
    root: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    container: {
        overflowX: 'auto',
        height: '100%'
    },
    border: {
        border: `1px solid ${theme.palette.text.hint}`
    },
    table: {
        display: 'table',
    },
    search: {
        marginTop: 12,
        marginBottom: 12,
        marginLeft: 16,
        maxWidth: 300,
        flexWrap: 'nowrap'
    },
    clearSearchButton: {
        width: 20,
        height: 20,
        fontSize: '16px',
        '& > span': {
            position: 'absolute'
        }
    },
    pagination: {
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        // borderTop: '1px solid rgba(224, 224, 224, 1)',
        // flexBasis: 56,
        flexShrink: 0,
        '& > *': {
            flexGrow: 1,
        }
    },
    noWrap: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    customComponentsContainer: {

    }
});

class MuiTable<T> extends React.Component<TableProps<T> & WithStyles<typeof styles>, TableState<T>> {
    static defaultProps: Omit<TableProps, 'data' | 'columns'> = {
        className: undefined,
        headClasses: undefined,
        bodyClasses: undefined,
        // data: [],
        dataId: '',
        // columns: [],
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
            pagination: true,
            rowsPerPage: 10,
            rowsPerPageOptions: [10, 20, 40],
            currentPage: 0,
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
            FilterComponents: [],
            CustomComponents: [],
            ToolbarComponent: TableToolbar,
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
                    formatter = new SearchHighlightedFormatter(),
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

        if (newValues.filteredData !== undefined && filteredData.length) {
            const filteredIds = _.intersection(displayData.map(row => row.id), ...(filteredData.filter(item => !!item) as TableRowId[][]));
            displayData = displayData.filter(row => filteredIds.includes(row.id));
        }

        if (newValues.searchText !== undefined && searchText) {
            if (prevState.searchText !== searchText) {
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
            } else if (searchMatchers) {
                const rowIds = Object.keys(searchMatchers);
                displayData = displayData.filter(row => rowIds.includes(_.toString(row.id)));
            }
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
            currentPage: mergedState.options.pagination
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
            pagination,
            rowsPerPageOptions,
        } = options;

        return (
            <>
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

                {pagination &&
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
            </>
        );
    };

    render() {
        const {
            className,
            classes,
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
            title,
            showBorder,
            showToolbar,
            showHeader,
            stickyHeader,
            pagination,
            noWrap,
            elevation,
            customActions,
            ToolbarComponent,
            FilterComponents,
            CustomComponents,
            RowExpandComponent,
        } = options as Required<TableOptions<T>>;

        const displayColumns = columns.filter(column => column.display || !column.name);
        const currentPageData = pagination ? displayData.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage) : displayData;

        return (
            <Paper
                elevation={showBorder ? 0 : elevation}
                className={cx(classes.root, className, {
                    [classes.border]: showBorder
                })}>


                {showToolbar &&
                    <ToolbarComponent
                        title={title}
                        columns={columns}
                        selectionCount={rowSelections.length}
                        customActions={customActions}
                        onToggleColumn={this.toggleColumn}
                        onDragColumn={this.reorderColumns} />
                }

                {(CustomComponents.length > 0 || FilterComponents.length > 0) &&
                    <div style={{ marginTop: !title ? -44 : undefined }} className={classes.customComponentsContainer}>
                        {CustomComponents.map((Component, index) => <Component key={index} />)}

                        {FilterComponents.map((Component, index) =>
                            <Component
                                key={index}
                                data={data}
                                displayData={displayData}
                                onUpdateFilter={(ids) => this.updateFilter(index, ids)} />)
                        }
                    </div>
                }

                {pagination &&
                    <div className={classes.pagination}>
                        {this.renderPagination()}
                    </div>
                }

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
                                            className={cx({ [classes.noWrap]: noWrap })}
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
                                        className={cx({ [classes.noWrap]: noWrap })}
                                        classes={bodyClasses}
                                        columns={displayColumns}
                                        data={currentPageData}
                                        options={options}                                        
                                        // isLoading={status === asyncStatuses.PENDING}
                                        // hasError={status === asyncStatuses.ERROR}
                                        searchMatchers={searchMatchers}
                                        rowCount={pagination ? rowsPerPage : displayData.length}
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
export default class WrappedMuiTable<T> extends React.Component<PropsFor<WrappedMuiTable<T>["Component"]>, {}> {
    private readonly Component = withStyles(styles, { name: 'MuiTable' })(
        (props: JSX.LibraryManagedAttributes<typeof MuiTable, MuiTable<T>["props"]>) => <MuiTable<T> {...props} />
    );

    render() {
        return <this.Component {...this.props} />;
    }
}