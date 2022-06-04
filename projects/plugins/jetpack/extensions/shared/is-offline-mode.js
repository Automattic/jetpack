import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { get } from 'lodash';

/**
 * Is Jetpack in offline mode?
 *
 * @returns {boolean} Whether Jetpack's offline mode is active.
 */
export default function isOfflineMode() {
	return get( getJetpackData(), [ 'jetpack', 'is_offline_mode' ], false );
}
