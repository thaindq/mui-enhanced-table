import _ from 'lodash';
import { SearchMatcher } from '../../types';
import { Theme } from '@material-ui/core';


export type FormatProps<T = any> = {
    value: any, 
    matcher: SearchMatcher | null, 
    theme: Theme, 
    selected: boolean, 
    expanded: boolean, 
    item: T 
};

export type FormatFunction<T = any> = (props: FormatProps<T>) => React.ReactNode;

export abstract class BaseFormatter<T> {
    abstract format(props: FormatProps<T>): React.ReactNode;
    
    getValueString(value: any) {
        return _.toString(value);
    }
}

export default BaseFormatter;