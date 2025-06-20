import getJetpackData from './get-jetpack-data';

/**
 * Return the value of the Jetpack feature flag.
 *
 * To add a new feature flag, you need use the `jetpack_block_editor_feature_flags` filter.
 *
 * @param {string} flag - The feature flag to check.
 *
 * @return {boolean} Whether the current user is connected.
 */
export default function hasFeatureFlag( flag ) {
	const jetpackData = getJetpackData();
	if ( ! jetpackData ) {
		return false;
	}
	if ( ! jetpackData?.feature_flags ) {
		return false;
	}
	return Boolean( jetpackData.feature_flags?.[ flag ] );
}
