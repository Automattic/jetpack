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
