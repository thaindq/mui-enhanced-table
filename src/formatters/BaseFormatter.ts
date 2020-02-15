import _ from 'lodash';
import { FormatterProps } from '../../types';

export abstract class BaseFormatter<T = any> {
    abstract format(props: FormatterProps<T>): React.ReactNode;
    
    getValueString(value: any) {
        return _.toString(value);
    }
}

export default BaseFormatter;