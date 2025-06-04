import { toString } from 'lodash-es';
import React from 'react';
import { FormatterProps } from '../types';
import { BaseFormatter } from './BaseFormatter';

export class SearchHighlightedFormatter<T = any> extends BaseFormatter<T> {
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

    format({ value, matcher }: FormatterProps<T>) {
        if (!matcher) {
            return toString(value);
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
