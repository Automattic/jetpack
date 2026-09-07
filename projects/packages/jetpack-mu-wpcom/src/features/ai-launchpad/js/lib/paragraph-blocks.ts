/**
 * Escape HTML-significant characters so AI-drafted text cannot inject markup (stored XSS)
 * or break block delimiters.
 *
 * @param text - The plain text to escape.
 * @return The escaped text.
 */
function escapeHtml( text: string ): string {
	return text.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' );
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
