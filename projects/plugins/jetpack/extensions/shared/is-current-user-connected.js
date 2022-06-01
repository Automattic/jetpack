import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { get } from 'lodash';

/**
 * Return whether the current user is connected to WP.com.
 *
 * @returns {boolean} Whether the current user is connected.
 */
export default function isCurrentUserConnected() {
	return get( getJetpackData(), [ 'jetpack', 'is_current_user_connected' ], false );
}
