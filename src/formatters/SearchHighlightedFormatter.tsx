import React from 'react';
import BaseFormatter from './BaseFormatter';
import { FormatterProps } from '..';

class SearchHighlightedFormatter<T = any> extends BaseFormatter<T> {
    static instance: SearchHighlightedFormatter;

    static getInstance() {
        if (!this.instance) {
            this.instance = new SearchHighlightedFormatter();
        }

        return this.instance;
    }

    textColor?: string;
    backgroundColor?: string;

    constructor(textColor = 'black', backgroundColor = 'yellow') {
        super();
        this.textColor = textColor;
        this.backgroundColor = backgroundColor;
    }

    format({ value, item, matcher }: FormatterProps<T>) {
        if (!matcher) {
            return this.getValueString(value, item);
        }

        const { pre, post, match } = matcher;

        return (
            <>
                {pre}
                <span
                    style={{
                        backgroundColor: this.backgroundColor,
                        color: this.textColor,
                    }}
                >
                    {match}
                </span>
                {post}
            </>
        );
    }
}

export default SearchHighlightedFormatter;
