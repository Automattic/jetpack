/**
 * Escape HTML-significant characters so AI-drafted or translated text cannot inject markup
 * (stored XSS) or break block delimiters.
 *
 * @param text - The plain text to escape.
 * @return The escaped text.
 */
function escapeHtml( text: string ): string {
	return text.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' );
}

/**
 * Wrap a page heading in a Gutenberg heading block.
 *
 * @param text - The heading text.
 * @return The serialized block markup.
 */
export function headingBlock( text: string ): string {
	return (
		'<!-- wp:heading --><h2 class="wp-block-heading">' +
		escapeHtml( text ) +
		'</h2><!-- /wp:heading -->'
	);
}

/**
 * Serialize block attributes for a block delimiter, escaped the way `@wordpress/blocks`'
 * `serializeAttributes()` does so a translated value can never close the HTML comment.
 * A local copy, so the route bundle does not depend on wp-blocks for one function.
 *
 * @param attributes - The block attributes.
 * @return The JSON for the delimiter.
 */
export function blockAttributes( attributes: Record< string, unknown > ): string {
	return JSON.stringify( attributes )
		.replace( /--/g, '\\u002d\\u002d' )
		.replace( /</g, '\\u003c' )
		.replace( />/g, '\\u003e' )
		.replace( /&/g, '\\u0026' )
		.replace( /\\"/g, '\\u0022' );
}

/**
 * Wrap each paragraph in a Gutenberg paragraph block.
 *
 * @param paragraphs - The paragraph strings.
 * @return The serialized block markup.
 */
export function paragraphsToBlocks( paragraphs: string[] ): string {
	return paragraphs
		.map( text => '<!-- wp:paragraph --><p>' + escapeHtml( text ) + '</p><!-- /wp:paragraph -->' )
		.join( '\n\n' );
}
