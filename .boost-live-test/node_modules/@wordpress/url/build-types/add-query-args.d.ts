/**
 * Appends arguments as querystring to the provided URL. If the URL already
 * includes query arguments, the arguments are merged with (and take precedent
 * over) the existing set.
 *
 * @param url  URL to which arguments should be appended. If omitted,
 *             only the resulting querystring is returned.
 * @param args Query arguments to apply to URL.
 *
 * @example
 * ```js
 * const newURL = addQueryArgs( 'https://google.com', { q: 'test' } ); // https://google.com/?q=test
 * ```
 *
 * @return URL with arguments applied.
 */
export declare function addQueryArgs(url?: string, args?: Record<string, unknown>): string;
//# sourceMappingURL=add-query-args.d.ts.map