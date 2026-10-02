/**
 * Returns the fragment part of the URL.
 *
 * @param url The full URL
 *
 * @example
 * ```js
 * const fragment1 = getFragment( 'http://localhost:8080/this/is/a/test?query=true#fragment' ); // '#fragment'
 * const fragment2 = getFragment( 'https://wordpress.org#another-fragment?query=true' ); // '#another-fragment'
 * ```
 *
 * @return The fragment part of the URL.
 */
export declare function getFragment(url: string): string | void;
//# sourceMappingURL=get-fragment.d.ts.map