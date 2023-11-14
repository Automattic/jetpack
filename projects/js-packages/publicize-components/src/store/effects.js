import { dispatch, select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Effect handler to toggle and store Post Share enable feature state.
 *
 * @returns {object} Updateting jetpack_publicize_feature_enabled post meta action.
 */
export async function togglePublicizeFeature() {
	const isPublicizeFeatureEnabled = select( 'jetpack/publicize' ).getFeatureEnableState();
	return dispatch( editorStore ).editPost( {
		meta: { jetpack_publicize_feature_enabled: ! isPublicizeFeatureEnabled },
	} );
}

export default {
	TOGGLE_PUBLICIZE_FEATURE: togglePublicizeFeature,
};
