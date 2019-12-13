import _ from 'lodash';
import { SearchMatcher } from "../types";

export default class Utils {
    static getMatcher = (input: string, query: string): SearchMatcher | null => {
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

    static reorder = (input: any[], sourceIndex: number, destinationIndex: number): any[] => {
        const output = [ ...input ];
        const item = output[sourceIndex];
        output.splice(sourceIndex, 1);
        output.splice(destinationIndex, 0, item);
        return output;
    };
}