/**
 * Checks for invalid characters within the provided query string.
 *
 * @param queryString The query string.
 *
 * @example
 * ```js
 * const isValid = isValidQueryString( 'query=true&another=false' ); // true
 * const isNotValid = isValidQueryString( 'query=true?another=false' ); // false
 * ```
 *
 * @return True if the argument contains a valid query string.
 */
export declare function isValidQueryString(queryString: string): boolean;
//# sourceMappingURL=is-valid-query-string.d.ts.map