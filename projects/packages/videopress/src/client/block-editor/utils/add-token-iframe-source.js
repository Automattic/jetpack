/**
 * Adds token via the query param `metadata_token` into VideoPress iframe's source.
 *
 * @param {string} html - VideoPress iframe HTML.
 * @param {string} token - Token.
 * @returns {string} - VideoPres iframe HTML with source updated with token.
 */
export default function addTokenIntoIframeSource( html, token ) {
	if ( ! html || ! token ) {
		return html;
	}

	const srcRegex = /src=['"](.*?)['"]/i;
	const srcMatch = html.match( srcRegex );
	const srcURL = srcMatch?.[ 1 ];
	if ( ! srcURL ) {
		// eslint-disable-next-line no-console
		console.warn( "VideoPress iframe doesn't have 'src'  attribute." );
		return html;
	}

	const newSrcURL = srcURL.indexOf( '?' )
		? `${ srcURL }&amp;metadata_token=${ token }`
		: `${ srcURL }?metadata_token=${ token }`;
	return html.replace( srcRegex, `src='${ newSrcURL }'` );
}
