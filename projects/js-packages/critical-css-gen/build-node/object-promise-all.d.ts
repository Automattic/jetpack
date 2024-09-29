/**
 * Given an object full of promises, resolves all of them and returns an object containing resultant values.
 * Roughly equivalent of Promise.all, but applies to an object.
 *
 * @param {object} object - containing promises to resolve
 * @return {object} - Promise which resolves to an object containing resultant values
 */
export declare function objectPromiseAll<ValueType>(object: {
    [key: string]: Promise<ValueType>;
}): Promise<{
    [key: string]: ValueType;
}>;
