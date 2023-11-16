import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Get whether the post has already been shared.
 *
 * @returns {boolean} Object with Jetpack Social options.
 */
export function getJetpackSocialPostAlreadyShared() {
	const { getEditedPostAttribute } = select( editorStore );

	const alreadyShared = getEditedPostAttribute( 'meta' )?.jetpack_social_post_already_shared;

	return alreadyShared ?? false;
}
