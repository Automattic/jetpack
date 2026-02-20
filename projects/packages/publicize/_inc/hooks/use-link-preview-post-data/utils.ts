import type { Attachment } from '@wordpress/core-data';

/**
 * Gets the URL of the media. Tries loading a smaller size (1024px width) if available and falls back to the full size.
 *
 * @param {Attachment} media - Media object
 * @return URL address
 */
export function getMediaSourceUrl( media: Attachment | null ): string {
	if ( ! media ) {
		return '';
	}

	// Try getting the large size (1024px width) and fallback to the full size.
	return media.media_details?.sizes?.large?.source_url || media.source_url;
}

/**
 * Gets the URL of an image from the post body
 *
 * @param {string} editedPostContent - The post content coming from core/editor
 * @return URL address
 */
export function getPostImageUrl( editedPostContent: string ): string | null {
	const parser = new DOMParser();
	const doc = parser.parseFromString( editedPostContent, 'text/html' );
	const imgElements = Array.from( doc.querySelectorAll( 'img' ) );

	const imageUrl = imgElements[ 0 ]?.src;

	return imageUrl ?? null;
}
