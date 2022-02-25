import { isArray, isString, mergeWith, union, xor } from 'lodash';
import { SearchMatcher } from './types';

export function getMatcher(input: string, query: string): SearchMatcher | null {
    if (!input || !query) {
        return null;
    }

    const matchIndex = isString(input) && isString(query) ? input.toLowerCase().indexOf(query.toLowerCase()) : -1;

    if (matchIndex >= 0) {
        return {
            pre: input.substring(0, matchIndex),
            post: input.substring(matchIndex + query.length),
            match: input.substring(matchIndex, matchIndex + query.length),
        };
    }

    return null;
}

export function reorder<T = any>(input: readonly T[], sourceIndex: number, destinationIndex: number): T[] {
    const output = [...input];
    const item = output[sourceIndex];
    output.splice(sourceIndex, 1);
    output.splice(destinationIndex, 0, item);
    return output;
}

export function toggleArrayItem<T = any>(array: T[], values: T[], forceValue?: boolean): T[] {
    return forceValue === undefined
        ? xor(array, values)
        : forceValue
        ? union(array, values)
        : array.filter((item) => !values.includes(item));
}

export function mergeOverwriteArray(obj: any, src: any) {
    return mergeWith(obj, src, (objValue, srcValue) => {
        if (isArray(srcValue)) {
            return srcValue;
        }
    });
}

type FieldNames<Names extends string, Prefix extends string = ''> = {
    [Name in Names]: Prefix extends '' ? `${Name}` : `${Prefix}-${Name}`;
};
export function generateNamesObject<Names extends string>(name: Names, ...args: Names[]): FieldNames<Names>;
export function generateNamesObject<Names extends string, Prefix extends string = ''>(
    fields: readonly Names[],
    prefix?: Prefix,
): FieldNames<Names, Prefix>;
export function generateNamesObject<Names extends string, Prefix extends string = ''>(
    ...args: any
): FieldNames<Names, Prefix> {
    let names: Names[] = [];
    let prefix: Prefix | undefined;

    if (isArray(args[0])) {
        names = args[0];
        prefix = args[1];
    } else {
        names = args;
    }

    return names.reduce((result, name) => {
        result[name] = (prefix ? `${prefix}-${name}` : `${name}`) as any;
        return result;
    }, {} as FieldNames<Names, Prefix>);
}
