import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { isPublicizeEnabled } from './is-publicize-enabled';

/**
 * Toggle and store Post Share enable feature state.
 *
 * @returns {object} Updateting jetpack_publicize_feature_enabled post meta action.
 */
export function togglePublicizeFeature() {
	const isPublicizeFeatureEnabled = isPublicizeEnabled();

	return dispatch( editorStore ).editPost( {
		meta: { jetpack_publicize_feature_enabled: ! isPublicizeFeatureEnabled },
	} );
}
