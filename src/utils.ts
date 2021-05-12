import { isArray, isString, mergeWith, union, xor } from 'lodash';
import { SearchMatcher } from '.';

export function getMatcher(input: string, query: string): SearchMatcher | null {
    if (!input || !query) {
        return null;
    }

    const matchIndex = isString(input) && isString(query)
        ? input.toLowerCase().indexOf(query.toLowerCase())
        : -1;

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
    const output = [ ...input ];
    const item = output[sourceIndex];
    output.splice(sourceIndex, 1);
    output.splice(destinationIndex, 0, item);
    return output;
};

export function toggleArrayItem<T = any>(array: T[], values: T[], forceValue?: boolean): T[] {
    return forceValue === undefined
        ? xor(array, values)
        : forceValue
            ? union(array, values)
            : array.filter(item => !values.includes(item));
}

export function mergeOverwriteArray(obj: any, src: unknown) {
    return mergeWith(obj, src, (objValue, srcValue) => {
        if (isArray(srcValue)) {
            return srcValue;
        }
    });
}

export default {
    getMatcher,
    reorder,
    toggleArrayItem,
    mergeOverwriteArray,
}