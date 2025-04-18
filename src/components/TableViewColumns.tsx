import { DragHandle } from '@mui/icons-material';
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    styled,
    Box,
    formControlClasses,
} from '@mui/material';
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

const Root = styled(Box)(({ theme }) => ({
    [`& .${formControlClasses.root}`]: {
        padding: theme.spacing(2, 2, 2, 3),
    },
    [`& .${muiTableViewColumnsClasses.dragHandle}`]: {
        display: 'inline-block',
        verticalAlign: 'middle',
        marginRight: theme.spacing(1),
    },
    [`& .${muiTableViewColumnsClasses.resetButton}`]: {
        marginTop: theme.spacing(1),
    },
}));

interface TableViewColumnProps {
    translations?: TableTranslations;
    columns: readonly TableColumn[];
    onColumnToggle: (columnId: TableColumnId, display?: boolean) => void;
    onColumnDrag: (result: DropResult, provided: ResponderProvided) => void;
    onColumnsReset: () => void;
}

export const TableViewColumns: React.FunctionComponent<TableViewColumnProps> = ({
    translations,
    columns,
    onColumnDrag,
    onColumnsReset,
    onColumnToggle,
}) => {
    return (
        <DragDropContext onDragEnd={onColumnDrag}>
            <Droppable droppableId="droppable" direction="vertical">
                {(provided: DroppableProvided) => (
                    <Root ref={provided.innerRef} {...provided.droppableProps}>
                        <FormControl component={'fieldset'}>
                            <FormGroup>
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
                                                        <DragHandle className={muiTableViewColumnsClasses.dragHandle} />
                                                    </div>

                                                    <FormControlLabel
                                                        key={column.id}
                                                        label={
                                                            column.name || <i>{translations?.untitled ?? 'Untitled'}</i>
                                                        }
                                                        control={
                                                            <Checkbox
                                                                value={column.name}
                                                                checked={column.display}
                                                                onChange={() => onColumnToggle(column.id)}
                                                            />
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}

                                {provided.placeholder}

                                <Button
                                    color="error"
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
};

export const muiTableViewColumnsClasses = generateNamesObject(
    ['container', 'dragHandle', 'resetButton'],
    TableViewColumns.name,
);
