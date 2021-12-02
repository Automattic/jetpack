/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

/**
 * Return whether the current user is connected to WP.com.
 *
 * @returns {boolean} Whether the current user is connected.
 */
export default function isCurrentUserConnected() {
	return get( getJetpackData(), [ 'jetpack', 'is_current_user_connected' ], false );
}
