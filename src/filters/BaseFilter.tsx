import React from 'react';
import { FilterProps } from '../types';

export abstract class BaseFilter<Props = object, State = object, T = any> extends React.PureComponent<
    Props & FilterProps<T>,
    State
> {
    componentDidUpdate = (prevProps: Props & FilterProps<T>) => {
        if (prevProps.data !== this.props.data) {
            this.updateFilter();
        }
    };

    abstract updateFilter(): void;
}
