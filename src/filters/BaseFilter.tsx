import React from 'react';
import { TableFilterComponentProps } from '../../types';

class BaseFilter<Props extends TableFilterComponentProps, State = {}> extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        if (!props.column && !props.columnData) {
            throw new Error('Either `column` or `columnData` must be provided')
        }
    }

    componentDidUpdate = (prevProps: Props) => {
        if (prevProps.data !== this.props.data) {
            this.updateFilter();
        }
    }

    updateFilter = (): void => {
        throw new Error('Not Implemented');
    }
}

export default BaseFilter;