/**
 * External dependencies
 */
import debugFactory from 'debug';
import { isAtomicSite, isSimpleSite } from '../../site-type-utils';

const initialState = window?.JP_CONNECTION_INITIAL_STATE;
const debug = debugFactory( 'shared-extension-utils:connection' );
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
 * @return {boolean} true if the user is connected, false otherwise.
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

/**
 * Return whether the user can purchase plan.
 *
 * @return {boolean} true if the user can purchase plan, false otherwise.
 */
export function canUserPurchasePlan(): boolean {
	if ( isSimpleSite() ) {
		// Roles on simple sites can't be inferred from the connection status.
		return true;
	}

	const permissions =
		initialState?.userConnectionData?.currentUser?.permissions ??
		( {} as { manage_options?: boolean } );

	return ! permissions.manage_options === false;
}
