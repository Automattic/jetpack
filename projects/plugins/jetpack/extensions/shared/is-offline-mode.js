/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

/**
 * Is Jetpack in offline mode?
 *
 * @returns {boolean} Whether Jetpack's offline mode is active.
 */
export default function isOfflineMode() {
	return get( getJetpackData(), [ 'jetpack', 'is_offline_mode' ], false );
}
