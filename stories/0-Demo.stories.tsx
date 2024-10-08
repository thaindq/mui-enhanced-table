import { Typography } from '@mui/material';
import { faker } from '@faker-js/faker';
import React from 'react';
import MuiTable, { TableColumn } from '../src';

const data = Array(100)
    .fill(null)
    .map(() => {
        return {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            age: faker.number.int({ min: 10, max: 100 }),
            country: faker.location.country(),
        };
    });

type Type = typeof data[0];

const columns: TableColumn<Type>[] = [
    {
        name: 'First Name',
        id: 'firstName',
    },
    {
        name: 'Last Name',
        id: 'lastName',
    },
    {
        name: 'Age',
        id: 'age',
        getValue: (item) => item.country,
    },
    {
        name: 'Country',
        id: 'country',
    },
];

export const SimpleTable: React.VFC = () => (
    <MuiTable<Type>
        title="Test table"
        columns={columns}
        data={data}
        dataId={(item) => `${item.country} + ${Math.random()}`}
        options={{
            elevation: 0,
            exportable: true,
            rowsPerPageOptions: [10],
            // dataLimit: 5,
            // showBorder: true,
            // showTitle: false,
            // showToolbar: false,
        }}
        init={{
            hiddenColumns: ['age'],
            columnOrders: ['age', 'country', 'lastName'],
        }}
        components={{
        }}
        onRowClick={(id) => console.log(id)}
        onDataExport={(data) => console.log(data)}
    />
);

export default {
    title: 'Demo',
};
