/**
 * External dependencies
 */
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import debugFactory from 'debug';

const initialState = window?.JP_CONNECTION_INITIAL_STATE;
const debug = debugFactory( 'jetpack-ai-assistant:connection' );

/**
 * Return the initial connection status.
 *
 * @returns {boolean} true if the user is connected, false otherwise.
 */
export function isUserConnected(): boolean {
	if ( isSimpleSite() ) {
		debug( 'Simple site connected ✅' );
		return true;
	}

	if ( isAtomicSite() ) {
		debug( 'Atomic site connected ✅' );
		return true;
	}

	if ( initialState?.connectionStatus?.isUserConnected ) {
		debug( 'Jetpack user is connected ✅' );
		return true;
	}

	debug( 'User is not connected ❌' );
	return false;
}
