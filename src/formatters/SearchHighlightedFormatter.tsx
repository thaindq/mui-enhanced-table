import React from 'react';
import BaseFormatter, { FormatProps } from './BaseFormatter';

class SearchHighlightedFormatter<T = any> extends BaseFormatter<T> {
    highlightColor?: string;
    backgroundColor?: string;

    constructor(highlightColor?: string, backgroundColor?: string) {
        super();
        this.highlightColor = highlightColor;
        this.backgroundColor = backgroundColor;
    }

    format({
        value,
        matcher,
        theme,
    }: FormatProps<T>) {
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
                    backgroundColor: this.backgroundColor ?? theme.palette.secondary.light,
                    color: this.highlightColor ?? theme.palette.secondary.contrastText,
                }}>{match}</span>{post}
            </>
        );
    }
}

export default SearchHighlightedFormatter;
