import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Return True if Publicize Feature is enabled.
 * Otherwise, return False.
 *
 * @returns {boolean} Whether or not the publicize feature is enabled.
 */
export function isPublicizeEnabled() {
	const { getEditedPostAttribute } = select( editorStore );

	const enabled = getEditedPostAttribute( 'meta' )?.jetpack_publicize_feature_enabled;

	return enabled ?? true;
}
