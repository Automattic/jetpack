import type { QueryArgParsed } from './get-query-arg';
type QueryArgs = Record<string, QueryArgParsed>;
/**
 * Returns an object of query arguments of the given URL. If the given URL is
 * invalid or has no querystring, an empty object is returned.
 *
 * @param url URL.
 *
 * @example
 * ```js
 * const foo = getQueryArgs( 'https://wordpress.org?foo=bar&bar=baz' );
 * // { "foo": "bar", "bar": "baz" }
 * ```
 *
 * @return Query args object.
 */
export declare function getQueryArgs(url: string): QueryArgs;
export {};
//# sourceMappingURL=get-query-args.d.ts.map