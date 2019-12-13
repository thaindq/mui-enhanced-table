import { createStyles, FormControl, IconButton, Input, InputAdornment, Paper, SortDirection, Table, TablePagination, Theme, withStyles } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import { WithStyles } from '@material-ui/styles';
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
        border: '1px solid rgb(174, 174, 174)'
    },    
    table: {
        height: 'calc(100% - 1px)',
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

class MuiTable extends React.Component<TableProps & WithStyles<typeof styles>, TableState> {
    static defaultProps: TableProps = {
        className: undefined,
        headClasses: undefined,
        bodyClasses: undefined,
        data: [],
        dataId: 'id',
        columns: [],
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
            showHeaders: true,
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
    };

    static getInitialState = (props: TableProps): TableState => {
        const {
            data,
            dataId,
            columns,
        } = props;

        const {
            rowsPerPage,
            columnHidings,
            rowSelections,
            rowExpansions,
            sortBy,
            sortDirection,
            currentPage,
        } = {
            ...MuiTable.defaultProps.options, 
            ...props.options
         } as Required<TableOptions>;

        const seenColumnIds: string[] = [];

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
            originalData: data,
            data: data.map((item, index) => {
                return {
                    ...item,
                    _id: !!dataId ? item[dataId] : index,
                };
            }),
            columns: columns.map(column => {
                const {
                    id,
                    name = '',
                    display = true,
                    sortable = true,
                    filterable = true,
                    searchable = true,
                    // formatter = Formatter,
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
                    // formatter,
                    ...rest,
                };
            }),
        };
    }

    static getNextState = (newValues: Partial<TableState>, prevState: TableState, props: TableProps): TableState => {
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

        let displayData = data;
        let searchMatchers: SearchMatchers | null = searchText && prevState.searchMatchers || null;

        if (searchText) {
            if (prevState.searchText !== searchText) {                
                const searchColumns = columns.filter(column => column.searchable);

                displayData = displayData.filter(item => {
                    let match = false;
                    const matchers: {
                        [columnId: string]: SearchMatcher
                    } = {};

                    searchColumns.forEach(column => {
                        const stringValue = item[column.id]; //column.formatter.getValueString(item[column.id]);
                        const matcher = Utils.getMatcher(stringValue, searchText);

                        // const matcher = SmartTableV2.getSearchMatcher(searchText, column, item);

                        if (matcher) {
                            match = true;
                            matchers[column.id] = matcher;
                        }
                    });

                    if (match) {
                        if (!searchMatchers) {
                            searchMatchers = {};
                        }

                        searchMatchers[item._id] = matchers;
                    }

                    return match;
                });
            } else if (searchMatchers) {
                const rowIds = Object.keys(searchMatchers);
                displayData = displayData.filter(item => rowIds.includes(_.toString(item._id)));
            }
        } else {
            searchMatchers = null;
        }

        if (filteredData.length) {
            const filteredIds = _.intersection(displayData.map(item => item._id), ...(filteredData.filter(item => !!item) as TableRowId[][]));
            displayData = displayData.filter(item => filteredIds.includes(item._id));
        }

        const sortColumn = _.find(columns, column => column.id === sortBy);

        return {
            ...mergedState,
            searchMatchers,
            currentPage: props.options.pagination ? Math.min(currentPage, Math.floor(displayData.length / rowsPerPage)) : 0,
            displayData: _.orderBy(displayData, obj => sortColumn && sortColumn.dateTime && Date.parse(_.get(obj, sortBy)) || _.get(obj, sortBy) || '', [sortDirection]),
        };
    }

    static getDerivedStateFromProps: GetDerivedStateFromProps<TableProps, TableState> = (nextProps, prevState) => {
        if (nextProps.data !== prevState.originalData) {
            return MuiTable.getNextState(MuiTable.getInitialState(nextProps), prevState, nextProps);
        }

        return null;
    }

    state: TableState = {
        ...MuiTable.defaultState,
        ...this.props
    };

    componentDidMount = () => {
        this.updateTableState(MuiTable.getInitialState(this.props));
    }

    updateTableState = (newValues: Partial<TableState>, callback?: (newState: TableState) => void) => {
        const onStateChange = this.props.options.onStateChange;
        const prevState = this.state;
        const nextState = MuiTable.getNextState(newValues, prevState, this.props);

        this.setState(nextState, () => {
            callback && callback(nextState);
            onStateChange && onStateChange(nextState, prevState);
        });
    }

    toggleColumn = (columnId: TableColumnId, display?: boolean) => {        
        const index = _.findIndex(this.state.columns, column => column.id === columnId);        

        if (index !== -1) {
            const columns = [ ...this.state.columns ];

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
        const onRowSelectionsChange = this.props.options.onRowSelectionsChange;
        const ids = _.isArray(rowId) ? rowId : [rowId];
        const prevRowSelections = this.state.rowSelections;
        const nextRowSelections = !this.props.options.multiSelect
            ? ids
            : !_.isBoolean(select)
                ? _.xor(prevRowSelections, ids)
                : select
                    ? _.union(prevRowSelections, ids)
                    : prevRowSelections.filter(id => !ids.includes(id));

        this.updateTableState({
            rowSelections: nextRowSelections
        }, () => onRowSelectionsChange && onRowSelectionsChange(nextRowSelections, prevRowSelections));
    }

    toggleRowExpansion = (rowId: TableRowId | TableRowId[], expand?: boolean) => {
        const onRowExpansionsChange = this.props.options.onRowExpansionsChange;
        const ids = _.isArray(rowId) ? rowId : [rowId];
        const prevRowExpansions = this.state.rowExpansions;
        const nextRowExpansions = !this.props.options.multiExpand
            ? ids
            : !_.isBoolean(expand)
                ? _.xor(prevRowExpansions, ids)
                : expand
                    ? _.union(prevRowExpansions, ids)
                    : prevRowExpansions.filter(id => !ids.includes(id));

        this.updateTableState({
            rowExpansions: nextRowExpansions
        }, () => onRowExpansionsChange && onRowExpansionsChange(nextRowExpansions, prevRowExpansions));
    }

    toggleSelectAllRows = (select?: boolean) => {
        const {
            displayData,
            rowSelections,            
        } = this.state;

        const {
            onRowStatus,
            onRowSelectionsChange,
        } = this.props.options;

        const enabledItems = displayData.filter((item, index) => {
            if (!onRowStatus) {
                return true;
            }

            const status = onRowStatus(item._id, item, index);
            return status ? !status.disabled : true;
        });

        const shouldSelectAll = !_.isBoolean(select)
            ? rowSelections.length !== enabledItems.length
            : !!select;

        const nextRowSelections = shouldSelectAll
            ? _.union(rowSelections, enabledItems.map(item => item._id))
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
        const filteredData = [ ...this.state.filteredData ];
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
            options,
        } = this.props;

        const {
            searchText,
            displayData,
            currentPage,
            rowsPerPage,            
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
                        ActionsComponent={TablePaginationActions}/>
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
            options,
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
        } = this.state;

        const {
            title,
            sortable,
            selectable,
            expandable,
            multiSelect,
            showBorder,
            showToolbar,
            showHeaders,
            pagination,
            noWrap,
            highlightRow,
            alternativeRowColor,
            elevation,
            customActions,
            onRowActions,
            onRowClick,
            onRowStatus,
            onCellClick,
            onCellStatus,
            ToolbarComponent,
            FilterComponents,
            CustomComponents,
            RowExpandComponent,
        } = {
            ...MuiTable.defaultProps.options, 
            ...options
         } as Required<TableOptions>;

        const displayColumns = columns.filter(column => column.display || !column.name);
        const currentPageData = pagination ? displayData.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage) : displayData;

        return (
            <Paper
                elevation={elevation}
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
                        onDragColumn={this.reorderColumns}/>
                }

                {(CustomComponents.length > 0 || FilterComponents.length > 0) &&
                    <div style={{ marginTop: !title ? -44 : undefined }} className={classes.customComponentsContainer}>
                        {CustomComponents.map((Component, index) => <Component key={index}/>)}

                        {FilterComponents.map((Component, index) =>
                            <Component
                                key={index}
                                data={data}
                                displayData={displayData}
                                onUpdateFilter={(ids) => this.updateFilter(index, ids)}/>)
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

                                <Table className={classes.table}>
                                    {showHeaders &&
                                        <TableHead
                                            className={cx({ [classes.noWrap]: noWrap })}
                                            classes={headClasses}
                                            columns={displayColumns}
                                            options={options}
                                            selectionCount={rowSelections.length}
                                            rowCount={data.length}
                                            onToggleSelectAll={this.toggleSelectAllRows}
                                            onSortData={this.sortData}/>
                                    }

                                    <TableBody
                                        className={cx({ [classes.noWrap]: noWrap })}
                                        classes={bodyClasses}
                                        columns={displayColumns}
                                        data={currentPageData}
                                        options={options}
                                        // isLoading={status === asyncStatuses.PENDING}
                                        // hasError={status === asyncStatuses.ERROR}
                                        searchMatchers={searchMatchers}
                                        rowCount={pagination ? rowsPerPage : displayData.length}/>
                                </Table>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </Paper>
        );
    }
}

export default withStyles(styles, { name: 'MuiTable' })(MuiTable);
