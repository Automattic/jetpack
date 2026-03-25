/**
 * External dependencies
 */
import DOMPurify from 'dompurify';

/**
 * Sanitizes an HTML string using DOMPurify, allowing only safe formatting
 * markup suitable for chart tooltip content.
 *
 * @param html - The HTML string to sanitize
 * @return Sanitized HTML string safe for rendering
 */
export function sanitizeHtml( html: string ): string {
	return DOMPurify.sanitize( html, {
		ALLOWED_TAGS: [
			'a',
			'b',
			'br',
			'div',
			'em',
			'i',
			'li',
			'ol',
			'p',
			'small',
			'span',
			'strong',
			'sub',
			'sup',
			'table',
			'tbody',
			'td',
			'th',
			'thead',
			'tr',
			'u',
			'ul',
		],
		ALLOWED_ATTR: [ 'style', 'class', 'href', 'target', 'rel' ],
	} );
}
