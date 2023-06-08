/**
 * External dependencies
 */
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import debugFactory from 'debug';

const initialState = window?.JP_CONNECTION_INITIAL_STATE;
const debug = debugFactory( 'jetpack-ai-assistant:connection' );
let hasCheckedConnection = false;

const debugOnce = content => {
	if ( ! hasCheckedConnection ) {
		debug( content );
		hasCheckedConnection = true;
	}
};

/**
 * Return the initial connection status.
 *
 * @returns {boolean} true if the user is connected, false otherwise.
 */
export function isUserConnected(): boolean {
	if ( isSimpleSite() ) {
		debugOnce( 'Simple site connected ✅' );
		return true;
	}

	if ( isAtomicSite() ) {
		debugOnce( 'Atomic site connected ✅' );
		return true;
	}

	if ( initialState?.connectionStatus?.isUserConnected ) {
		debugOnce( 'Jetpack user is connected ✅' );
		return true;
	}

	debugOnce( 'User is not connected ❌' );
	return false;
}
