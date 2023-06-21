import { DragHandle } from '@mui/icons-material';
import { Button, Checkbox, FormControl, FormControlLabel, FormGroup, styled } from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';
import {
    DragDropContext,
    Draggable,
    DropResult,
    Droppable,
    DroppableProvided,
    ResponderProvided,
} from 'react-beautiful-dnd';
import { TableColumn, TableColumnId, TableTranslations } from '../types';
import { generateNamesObject } from '../utils';

export const muiTableViewColumnsClasses = generateNamesObject(
    ['root', 'title', 'formGroup', 'formControl', 'checkbox', 'checkboxRoot', 'checked', 'dragHandle', 'resetButton'],
    'MuiTableViewColumns',
);

const Root = styled(Box)(({ theme }) => ({
    [`& .${muiTableViewColumnsClasses.root}`]: {
        padding: '8px 16px 16px 24px',
        fontFamily: 'Roboto',
    },
    [`& .${muiTableViewColumnsClasses.title}`]: {
        marginLeft: '-7px',
        fontSize: '14px',
        // color: "#424242",
        textAlign: 'left',
        fontWeight: 500,
    },
    [`& .${muiTableViewColumnsClasses.formGroup}`]: {
        marginTop: 8,
    },
    [`& .${muiTableViewColumnsClasses.formControl}`]: {
        // height: 36
    },
    [`& .${muiTableViewColumnsClasses.checkbox}`]: {
        // width: "32px",
        // height: "32px",
    },
    [`& .${muiTableViewColumnsClasses.checkboxRoot}`]: {
        // "&$checked": {
        //     color: "#027cb5",
        // },
    },
    [`& .${muiTableViewColumnsClasses.checked}`]: {},
    // [`& .${muiTableViewColumnsClasses.label}`]: {
    //     fontSize: "15px",
    //     marginLeft: "8px",
    //     color: "#4a4a4a",
    // },
    [`& .${muiTableViewColumnsClasses.dragHandle}`]: {
        display: 'inline-block',
        color: theme.palette.text.primary,
        verticalAlign: 'middle',
        marginRight: 8,
    },
    [`& .${muiTableViewColumnsClasses.resetButton}`]: {
        marginTop: 8,
    },
}));

interface TableViewColumnProps {
    translations?: TableTranslations;
    columns: readonly TableColumn[];
    onColumnToggle: (columnId: TableColumnId, display?: boolean) => void;
    onColumnDrag: (result: DropResult, provided: ResponderProvided) => void;
    onColumnsReset: () => void;
}

export class TableViewColumns extends React.Component<TableViewColumnProps> {
    renderCheckbox = (column: TableColumn) => {
        const { onColumnToggle } = this.props;

        return (
            <Checkbox
                className={muiTableViewColumnsClasses.checkbox}
                value={column.name}
                checked={column.display}
                onChange={() => onColumnToggle(column.id)}
                classes={{
                    root: muiTableViewColumnsClasses.checkboxRoot,
                    checked: muiTableViewColumnsClasses.checked,
                }}
            />
        );
    };

    render() {
        const { translations, columns, onColumnDrag, onColumnsReset } = this.props;

        return (
            <DragDropContext onDragEnd={onColumnDrag}>
                <Droppable droppableId="droppable" direction="vertical">
                    {(provided: DroppableProvided) => (
                        <Root ref={provided.innerRef} {...provided.droppableProps}>
                            <FormControl component={'fieldset'} className={muiTableViewColumnsClasses.root}>
                                <FormGroup className={muiTableViewColumnsClasses.formGroup}>
                                    {columns.map((column, index) => {
                                        return (
                                            <Draggable key={column.id} draggableId={column.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                        }}
                                                    >
                                                        <div
                                                            className={muiTableViewColumnsClasses.dragHandle}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <DragHandle
                                                                className={muiTableViewColumnsClasses.dragHandle}
                                                            />
                                                        </div>

                                                        <FormControlLabel
                                                            key={column.id}
                                                            label={column.name || <i>Untitled</i>}
                                                            control={this.renderCheckbox(column)}
                                                            classes={{
                                                                root: muiTableViewColumnsClasses.formControl,
                                                                // label: classes.label,
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}

                                    {provided.placeholder}

                                    <Button
                                        color="primary"
                                        className={muiTableViewColumnsClasses.resetButton}
                                        onClick={onColumnsReset}
                                    >
                                        {translations?.resetDefault ?? 'Reset to default'}
                                    </Button>
                                </FormGroup>
                            </FormControl>
                        </Root>
                    )}
                </Droppable>
            </DragDropContext>
        );
    }
}
