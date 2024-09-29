/**
 * Minifies the given CSS, returning it as a string. Any errors that occur are returned
 * in the second positional return value.
 *
 * If the CSS fails to minify, the original content will be returned instead.
 *
 * @param {string} css - CSS to minify.
 *
 * @return {[ string, string[] ]} - Minified CSS and a list of errors returned.
 */
export declare function minifyCss(css: string): [string, string[]];
