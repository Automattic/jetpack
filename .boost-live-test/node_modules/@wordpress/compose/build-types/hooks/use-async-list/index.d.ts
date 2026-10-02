type AsyncListConfig = {
    step: number;
};
/**
 * React hook returns an array which items get asynchronously appended from a source array.
 * This behavior is useful if we want to render a list of items asynchronously for performance reasons.
 *
 * @param list   Source array.
 * @param config Configuration object.
 *
 * @return Async array.
 */
declare function useAsyncList<T>(list: T[], config?: AsyncListConfig): T[];
export default useAsyncList;
//# sourceMappingURL=index.d.ts.map