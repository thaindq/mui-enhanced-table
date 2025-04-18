import { Formatter, FormatterProps } from '../types';

export abstract class BaseFormatter<T = any> implements Formatter<T> {
    constructor() {
        this.format = this.format.bind(this);
    }

    abstract format(props: FormatterProps<T>): React.ReactNode;
}
