/*
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';

/**
 * Whether the current user is connected to WordPress.com.
 *
 * Unlike `isUserConnected()` from `@automattic/jetpack-shared-extension-utils`,
 * this does not treat every Atomic (WoA) user as connected. Atomic has per-user
 * connections, so a user who has disconnected their own account is correctly
 * reported as not connected. WordPress.com Simple has no per-user connection, so
 * it is always true there.
 *
 * @return {boolean} Whether the current user is connected to WordPress.com.
 */
export function isCurrentUserConnected(): boolean {
	if ( isSimpleSite() ) {
		return true;
	}

	return !! window?.JP_CONNECTION_INITIAL_STATE?.connectionStatus?.isUserConnected;
}
