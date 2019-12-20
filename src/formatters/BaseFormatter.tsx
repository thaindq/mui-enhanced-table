import { Theme } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { SearchMatcher } from '../../types';

export type FormatFunction<T = any> = (value: any, matcher: SearchMatcher | null, theme: Theme, isSelected: boolean, isExpanded: boolean, item: T) => React.ReactNode;

export interface Formatter<T = any> {
    format: FormatFunction<T>;
    getValueString: (value: any) => string;
}

class BaseFormatter<T = any> implements Formatter<T> {
    format(value: any, matcher: SearchMatcher | null, theme: Theme, isSelected: boolean, isExpanded: boolean, item: T): React.ReactNode {
        if (!matcher) {
            return this.getValueString(value);
        }
 
        const {
            pre,
            post,
            match,
        } = matcher;

        return (
            <>
                {pre}<span style={{
                    backgroundColor: theme.palette.secondary.light,
                    color: theme.palette.secondary.contrastText,
                }}>{match}</span>{post}
            </>
        );
    }

    getValueString(value: any) {
        return _.toString(value);
    }
}

export default BaseFormatter;
