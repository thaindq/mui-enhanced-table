import React from 'react';
import { FilterProps } from '../../types';

export abstract class BaseFilter<Props = {}, State = {}, T = any> extends React.PureComponent<Props & FilterProps<T>, State> {
    constructor(props: Props & FilterProps<T>) {
        super(props);
    }

    componentDidUpdate = (prevProps: Props & FilterProps<T>) => {
        if (prevProps.data !== this.props.data) {
            this.updateFilter();
        }
    }

    abstract updateFilter(): void;
}

export default BaseFilter;