import { Checkbox, createStyles, FormControl, FormControlLabel, FormGroup, Theme, withStyles } from "@material-ui/core";
import { DragHandle } from "@material-ui/icons";
import { WithStyles } from "@material-ui/styles";
import React from "react";
import { DragDropContext, Draggable, Droppable, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { TableColumn } from "../../types";

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
        height: 32
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
        marginTop: 2,
        marginRight: 8,
    }
});

interface Props {
    columns: TableColumn[];
    onToggleColumn: (id: string) => void;
    onDragColumn: () => void;
}

class TableViewColumns extends React.Component<Props & WithStyles<typeof styles>> {

    renderCheckbox = (column: TableColumn) => {
        const {
            classes,
            onToggleColumn,
        } = this.props;

        return (
            <Checkbox
                className={classes.checkbox}
                value={column.name}
                checked={column.display}
                onChange={() => onToggleColumn(column.id)}
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
            onDragColumn,
        } = this.props;

        return (
            <DragDropContext onDragEnd={onDragColumn}>
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
                                </FormGroup>
                            </FormControl>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        );
    }
}

export default withStyles(styles, { name: "MuiTableViewColumn" })(TableViewColumns);
