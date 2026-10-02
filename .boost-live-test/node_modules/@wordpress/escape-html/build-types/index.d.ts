/**
 * Returns a string with ampersands escaped. Note that this is an imperfect
 * implementation, where only ampersands which do not appear as a pattern of
 * named, decimal, or hexadecimal character references are escaped. Invalid
 * named references (i.e. ambiguous ampersand) are still permitted.
 *
 * @see https://w3c.github.io/html/syntax.html#character-references
 * @see https://w3c.github.io/html/syntax.html#ambiguous-ampersand
 * @see https://w3c.github.io/html/syntax.html#named-character-references
 *
 * @param value Original string.
 *
 * @return Escaped string.
 */
export declare function escapeAmpersand(value: string): string;
/**
 * Returns a string with quotation marks replaced.
 *
 * @param value Original string.
 *
 * @return Escaped string.
 */
export declare function escapeQuotationMark(value: string): string;
/**
 * Returns a string with less-than sign replaced.
 *
 * @param value Original string.
 *
 * @return Escaped string.
 */
export declare function escapeLessThan(value: string): string;
/**
 * Returns an escaped attribute value.
 *
 * @see https://w3c.github.io/html/syntax.html#elements-attributes
 *
 * "[...] the text cannot contain an ambiguous ampersand [...] must not contain
 * any literal U+0022 QUOTATION MARK characters (")"
 *
 * Note we also escape the greater than symbol, as this is used by wptexturize to
 * split HTML strings. This is a WordPress specific fix
 *
 * Note that if a resolution for Trac#45387 comes to fruition, it is no longer
 * necessary for `__unstableEscapeGreaterThan` to be used.
 *
 * Note we also escape the less-than symbol to prevent HTML injection vulnerabilities
 * and parsing issues, particularly for users without the unfiltered_html capability.
 *
 * See: https://core.trac.wordpress.org/ticket/45387
 *
 * @param value Attribute value.
 *
 * @return Escaped attribute value.
 */
export declare function escapeAttribute(value: string): string;
/**
 * Returns an escaped HTML element value.
 *
 * @see https://w3c.github.io/html/syntax.html#writing-html-documents-elements
 *
 * "the text must not contain the character U+003C LESS-THAN SIGN (<) or an
 * ambiguous ampersand."
 *
 * @param value Element value.
 *
 * @return Escaped HTML element value.
 */
export declare function escapeHTML(value: string): string;
/**
 * Returns an escaped Editable HTML element value. This is different from
 * `escapeHTML`, because for editable HTML, ALL ampersands must be escaped in
 * order to render the content correctly on the page.
 *
 * @param value Element value.
 *
 * @return Escaped HTML element value.
 */
export declare function escapeEditableHTML(value: string): string;
/**
 * Returns true if the given attribute name is valid, or false otherwise.
 *
 * @param name Attribute name to test.
 *
 * @return Whether attribute is valid.
 */
export declare function isValidAttributeName(name: string): boolean;
//# sourceMappingURL=index.d.ts.map