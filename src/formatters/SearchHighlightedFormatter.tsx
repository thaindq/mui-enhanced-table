import React from 'react';
import BaseFormatter from './BaseFormatter';
import { FormatterProps } from '../../types';

class SearchHighlightedFormatter<T = any> extends BaseFormatter<T> {

    static instance: SearchHighlightedFormatter;
    
    static getInstance() {
        if (!this.instance) {
            this.instance = new SearchHighlightedFormatter();
        }

        return this.instance;
    }

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
    }: FormatterProps<T>) {
        if (!matcher) {
            return this.getValueString(value);
        }
 
        const {
            pre,
            post,
            match,
        } = matcher;

        const backgroundColor = this.backgroundColor ?? theme.palette.secondary.main;

        return (
            <>
                {pre}<span style={{
                    backgroundColor,
                    color: this.highlightColor ?? theme.palette.getContrastText(backgroundColor),
                }}>{match}</span>{post}
            </>
        );
    }
}

export default SearchHighlightedFormatter;
