import { Theme } from '@material-ui/core';
import _ from 'lodash';
import React, { Fragment } from 'react';
import { SearchMatcher } from '../../types';

interface FormatterProps {
    value: any;
    matcher?: SearchMatcher;
    theme?: Theme;
    isSelected?: boolean;
    item?: any;
}

class BaseFormatter<Props extends FormatterProps> extends React.Component<Props> {    
    format(value: any, matcher?: SearchMatcher, theme?: Theme, isSelected?: boolean, item?: any) {
        if (!matcher) {
            return this.getValueString(value);
        }

        const {
            pre,
            post,
            match,
        } = matcher;

        return (
            <Fragment>
                {pre}<span style={{
                    backgroundColor: 'yellow',
                    color: 'inherit',
                }}>{match}</span>{post}
            </Fragment>
        );
    }

    getValueString(value: any) {
        return _.toString(value);
    }

    render() {
        const {
            value,
            matcher,
            theme,
            isSelected,
            item,
        } = this.props;

        return this.format(value, matcher, theme, isSelected, item);
    }
}

export default BaseFormatter;
