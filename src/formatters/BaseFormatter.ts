import _ from 'lodash';
import { FormatterProps, Formatter } from '../../types';

export abstract class BaseFormatter<T> implements Formatter<T> {
    abstract format(props: FormatterProps<T>): React.ReactNode;
    
    getValueString(value: any) {
        return _.toString(value);
    }
}

export default BaseFormatter;