/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

/**
 * Return whether Jetpack is connected to WP.com.
 *
 * @returns {boolean} Whether Jetpack is connected to WP.com
 */
export default function isActive() {
	return get( getJetpackData(), [ 'jetpack', 'is_active' ], false );
}
