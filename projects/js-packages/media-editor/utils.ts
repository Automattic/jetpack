/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { audio, video, image, file } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { MediaType } from './types.ts';

/**
 * Get the media type from a mime type, including an icon.
 * TODO - media types should be formalized somewhere.
 *
 * References:
 * https://developer.wordpress.org/reference/functions/wp_mime_type_icon/
 * https://developer.wordpress.org/reference/hooks/mime_types/
 * https://developer.wordpress.org/reference/functions/wp_get_mime_types/
 *
 * @param mimeType - The mime type to get the media type from.
 * @return The media type.
 */
export function getMediaTypeFromMimeType( mimeType: string ): MediaType {
	if ( mimeType.startsWith( 'image/' ) ) {
		return {
			type: 'image',
			label: __( 'Image', 'jetpack-media-editor' ),
			icon: image,
		};
	}

	if ( mimeType.startsWith( 'video/' ) ) {
		return {
			type: 'video',
			label: __( 'Video', 'jetpack-media-editor' ),
			icon: video,
		};
	}

	if ( mimeType.startsWith( 'audio/' ) ) {
		return {
			type: 'audio',
			label: __( 'Audio', 'jetpack-media-editor' ),
			icon: audio,
		};
	}

	return {
		type: 'application',
		label: __( 'Application', 'jetpack-media-editor' ),
		icon: file,
	};
}
