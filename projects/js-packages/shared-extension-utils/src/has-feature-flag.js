import getJetpackData from './get-jetpack-data';

/**
 * Return the value of the Jetpack feature flag.
 *
 * @param {string} flag - The feature flag to check.
 *
 * @return {boolean} Whether the current user is connected.
 */
export default function hasFeatureFlag( flag ) {
	return Boolean( getJetpackData()?.feature_flags[ flag ] );
}
