export interface QueryArgObject {
    [key: string]: QueryArgParsed;
}
export type QueryArgParsed = string | string[] | QueryArgObject;
/**
 * Returns a single query argument of the url
 *
 * @param url URL.
 * @param arg Query arg name.
 *
 * @example
 * ```js
 * const foo = getQueryArg( 'https://wordpress.org?foo=bar&bar=baz', 'foo' ); // bar
 * ```
 *
 * @return Query arg value.
 */
export declare function getQueryArg(url: string, arg: string): QueryArgParsed | undefined;
//# sourceMappingURL=get-query-arg.d.ts.map