/**
 * Gets the URL of the media. Tries loading a smaller size (1024px width) if available and falls back to the full size.
 *
 * @param {object} media - Media object
 * @returns {?string} URL address
 */
export function getMediaSourceUrl( media ) {
	if ( ! media ) {
		return null;
	}

	// Try getting the large size (1024px width) and fallback to the full size.
	return media.media_details?.sizes?.large?.source_url || media.source_url;
}

/**
 * Get the text for the auto-shared tweet.
 *
 * @param {object} params - The params.
 * @param {string} params.title - The title.
 * @param {string} params.url 	- The url.
 * @param {string} params.text 	- The text.
 * @returns {string} The text for the auto-shared tweet.
 */
export function getAutoSharedTweetText( { title, url, text } ) {
	let content = ( text || title || '' ).trim();

	// 24 is the length of the URL and 2 is for the space and the ellipsis.
	const maxTweetLength = 280 - ( 24 + 2 );

	if ( content.length > maxTweetLength ) {
		// Get the limited number of characters without breaking words.
		content =
			content.match( new RegExp( '.{1,' + maxTweetLength + '}(?:\\s|$)', 'u' ) )?.[ 0 ]?.trim() ||
			'';
		content += '…';
	}

	return `${ content } ${ url }`;
}
