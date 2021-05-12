import { toString } from 'lodash';
import { FormatterProps, Formatter } from '..';

export abstract class BaseFormatter<T = any> implements Formatter<T> {
    abstract format(props: FormatterProps<T>): React.ReactNode;
    
    getValueString(value: any, item: T) {
        return toString(value);
    }
}

export default BaseFormatter;