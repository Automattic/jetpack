import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { get } from 'lodash';

/**
 * Return whether Jetpack is connected to WP.com.
 *
 * @returns {boolean} Whether Jetpack is connected to WP.com
 */
export default function isActive() {
	return get( getJetpackData(), [ 'jetpack', 'is_active' ], false );
}
