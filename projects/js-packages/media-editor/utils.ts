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

import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

export const getUnlock = () => {
	/**
	 * Sometimes Gutenberg doesn't allow you to re-register the module and throws an error.
	 * FIXME: The new version allow it by default, but we might need to ensure that all the site has the new version.
	 * @see https://github.com/Automattic/wp-calypso/pull/79663
	 */
	let unlock: ( object: any ) => any | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
	try {
		unlock = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
			'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
			'@wordpress/edit-site'
		).unlock;
		return unlock;
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Error: Unable to get the unlock api. Reason: %s', error );
		return undefined;
	}
};
