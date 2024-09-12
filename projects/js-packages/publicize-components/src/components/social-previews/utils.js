/**
 * Gets the URL of the media. Tries loading a smaller size (1024px width) if available and falls back to the full size.
 *
 * @param {object} media - Media object
 * @return {?string} URL address
 */
export function getMediaSourceUrl( media ) {
	if ( ! media ) {
		return null;
	}

	// Try getting the large size (1024px width) and fallback to the full size.
	return media.media_details?.sizes?.large?.source_url || media.source_url;
}

/**
 * Gets the URL of an image from the post body
 *
 * @param {string} editedPostContent - The post content coming from core/editor
 * @return {?string} URL address
 */
export function getPostImageUrl( editedPostContent ) {
	const parser = new DOMParser();
	const doc = parser.parseFromString( editedPostContent, 'text/html' );
	const imgElements = Array.from( doc.querySelectorAll( 'img' ) );

	const imageUrl = imgElements[ 0 ]?.src;

	return imageUrl ?? null;
}
