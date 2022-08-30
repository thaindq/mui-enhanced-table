import { toString } from 'lodash';
import { FormatterProps, Formatter } from '../types';

export abstract class BaseFormatter<T = any> implements Formatter<T> {
    abstract format(props: FormatterProps<T>): React.ReactNode;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getValueString(value: any, item: T) {
        return toString(value);
    }
}
