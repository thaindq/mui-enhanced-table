import { Checkbox, createStyles, FormControl, FormControlLabel, FormGroup, Theme, withStyles, Button } from "@material-ui/core";
import { DragHandle } from "@material-ui/icons";
import { WithStyles } from "@material-ui/styles";
import React from "react";
import { DragDropContext, Draggable, Droppable, DroppableProvided, DroppableStateSnapshot, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import { TableColumn, TableColumnId } from "..";

export const styles = (theme: Theme) => createStyles({
    root: {
        padding: "8px 16px 16px 24px",
        fontFamily: "Roboto",
    },
    title: {
        marginLeft: "-7px",
        fontSize: "14px",
        // color: "#424242",
        textAlign: "left",
        fontWeight: 500,
    },
    formGroup: {
        marginTop: "8px",
    },
    formControl: {
        // height: 36
    },
    checkbox: {
        // width: "32px",
        // height: "32px",
    },
    checkboxRoot: {
        // "&$checked": {
        //     color: "#027cb5",
        // },
    },
    checked: {},
    // label: {
    //     fontSize: "15px",
    //     marginLeft: "8px",
    //     color: "#4a4a4a",
    // },
    dragHandle: {
        display: 'inline-block',
        color: theme.palette.text.primary,
        verticalAlign: 'middle',
        marginRight: 8,
    },
    resetButton: {
        marginTop: 8,
    }
});

interface TableViewColumnProps {
    columns: readonly TableColumn[];
    onColumnToggle: (columnId: TableColumnId, display?: boolean) => void;
    onColumnDrag: (result: DropResult, provided: ResponderProvided) => void;
    onColumnsReset: () => void;
}

class TableViewColumns extends React.Component<TableViewColumnProps & WithStyles<typeof styles>> {

    renderCheckbox = (column: TableColumn) => {
        const {
            classes,
            onColumnToggle,
        } = this.props;

        return (
            <Checkbox
                className={classes.checkbox}
                value={column.name}
                checked={column.display}
                onChange={() => onColumnToggle(column.id)}
                classes={{
                    root: classes.checkboxRoot,
                    checked: classes.checked,
                }} />
        );
    }

    render() {
        const {
            classes,
            columns,
            onColumnDrag,
            onColumnsReset,
        } = this.props;

        return (
            <DragDropContext onDragEnd={onColumnDrag}>
                <Droppable droppableId="droppable" direction="vertical">
                    {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}>

                            <FormControl component={"fieldset"} className={classes.root}>
                                <FormGroup className={classes.formGroup}>
                                    {columns.map((column, index) => {
                                        return (

                                            <Draggable key={column.id} draggableId={column.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                        }}>

                                                        <div
                                                            className={classes.dragHandle}
                                                            {...provided.dragHandleProps}>

                                                            <DragHandle className={classes.dragHandle} />
                                                        </div>

                                                        <FormControlLabel
                                                            key={column.id}
                                                            label={column.name || <i>Untitled</i>}
                                                            control={this.renderCheckbox(column)}
                                                            classes={{
                                                                root: classes.formControl,
                                                                // label: classes.label,
                                                            }} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    
                                    {provided.placeholder}

                                    <Button color="primary" className={classes.resetButton} onClick={onColumnsReset}>Reset to default</Button>
                                </FormGroup>
                            </FormControl>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        );
    }
}

export default withStyles(styles, { name: 'MuiEnhancedTableViewColumn' })(TableViewColumns);
