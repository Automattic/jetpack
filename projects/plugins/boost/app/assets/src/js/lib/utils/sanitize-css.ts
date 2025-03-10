/**
 * Sanitizes CSS to prevent WAF false positives.
 * Make sure to update the PHP desanitization function
 * when this one is updated.
 *
 * @param css - The CSS to sanitize.
 * @return The sanitized CSS.
 */
export default function sanitizeCSS( css: string ): string {
	return css.replace( /xmlns/g, '__JB_XMLNS__' );
}
