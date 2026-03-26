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
	// Enforce rel="noopener noreferrer" on links with target="_blank" to prevent tab-napping
	DOMPurify.addHook( 'afterSanitizeAttributes', ( node: Element ) => {
		if ( node.tagName === 'A' && node.getAttribute( 'target' ) === '_blank' ) {
			node.setAttribute( 'rel', 'noopener noreferrer' );
		}
	} );

	const clean = DOMPurify.sanitize( html, {
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
		ALLOWED_ATTR: [ 'class', 'href', 'target', 'rel' ],
	} );

	DOMPurify.removeAllHooks();

	return clean;
}
