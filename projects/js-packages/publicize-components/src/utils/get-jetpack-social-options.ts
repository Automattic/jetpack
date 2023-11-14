import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { JetpackSocialOptions } from './types';

/**
 * Get all Jetpack Social options.
 *
 * @returns {JetpackSocialOptions} Object with Jetpack Social options.
 */
export function getJetpackSocialOptions(): JetpackSocialOptions {
	const { getEditedPostAttribute } = select( editorStore );
	const meta = getEditedPostAttribute( 'meta' );

	return meta?.jetpack_social_options || {};
}
