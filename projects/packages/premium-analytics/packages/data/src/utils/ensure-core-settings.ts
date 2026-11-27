/**
 * External dependencies
 */
import { currentUserCan } from '@automattic/jetpack-script-data';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, resolveSelect, select } from '@wordpress/data';

let readyPromise: Promise< void > | null = null;

/**
 * Starts loading the core 'site' record, memoized to avoid races and duplicate requests.
 *
 * After a failed load, the next call sends a new request; nothing retries in between.
 *
 * Resolves at once for a reader without `manage_options`: the settings route would only 403.
 */
export function ensureCoreSettingsReady(): Promise< void > {
	if ( ! currentUserCan( 'manage_options' ) ) {
		return Promise.resolve();
	}

	if ( ! readyPromise ) {
		// core-data replays a failed resolution's error without refetching until it is invalidated.
		if ( select( coreStore ).hasResolutionFailed( 'getEntityRecord', [ 'root', 'site' ] ) ) {
			dispatch( coreStore ).invalidateResolution( 'getEntityRecord', [ 'root', 'site' ] );
		}
		readyPromise = resolveSelect( coreStore )
			.getEntityRecord( 'root', 'site' )
			.then( () => void 0 )
			.catch( err => {
				readyPromise = null;
				throw err;
			} );
	}
	return readyPromise;
}
