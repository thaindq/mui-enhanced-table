import _ from 'lodash';
import { SearchMatcher } from '.';

export function getMatcher(input: string, query: string): SearchMatcher | null {
    const matchIndex = _.isString(input) && _.isString(query)
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
        ? _.xor(array, values)
        : forceValue
            ? _.union(array, values)
            : array.filter(item => !values.includes(item));
}

export function mergeOverwriteArray(obj: any, src: unknown) {
    return _.mergeWith(obj, src, (objValue, srcValue) => {
        if (_.isArray(srcValue)) {
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