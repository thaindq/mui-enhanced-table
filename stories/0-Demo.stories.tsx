import { Clear, Delete } from '@material-ui/icons';
import faker from 'faker';
import React from 'react';
import MuiTable from '../src';
import { TableColumn } from '../types';

export default {
    title: 'Demo',
};

const data = Array(100).fill(null).map(() => {
    return {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        age: faker.random.number({ min: 10, max: 100 }),
        country: faker.address.country()
    }
});

type Type = typeof data[0];

const columns: TableColumn<Type>[] = [
    {
        name: 'First Name',
        id: 'firstName',
    },
    {
        name: 'Last Name',
        id: 'lastName'
    },
    {
        name: 'Age',
        id: 'age',
    },
    {
        name: 'Country',
        id: 'country',
    }
];

export const toStorybook = () => (
    <MuiTable<Type>
        columns={columns}
        data={data}
        options={{
            title: 'Simple Table',
            elevation: 0,
            showBorder: true,
            onRowClick: (id, item, index) => {
                console.log(item)
            },
            onRowActions: (id, data, index) => {
                return [{
                    name: 'Clear',
                    icon: <Clear />,
                    callback: (event) => console.log('Clear: ' + index)
                }, {
                    name: 'Delete',
                    icon: <Delete />,
                    callback: (event) => console.log('Delete: ' + index)
                }];
            },
        }}
    />
);

toStorybook.story = {
    name: 'Simple Table',
};