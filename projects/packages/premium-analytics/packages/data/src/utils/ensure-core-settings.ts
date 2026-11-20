/**
 * External dependencies
 */
import { currentUserCan } from '@automattic/jetpack-script-data';
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';

let readyPromise: Promise< void > | null = null;

/**
 * Starts loading the core 'site' record, memoized to avoid races and duplicate requests.
 *
 * The memo is cleared on failure, but core-data keeps the failed resolution, so a later call
 * rejects again without a new request.
 *
 * Resolves at once for a reader without `manage_options`: the settings route would only 403.
 */
export function ensureCoreSettingsReady(): Promise< void > {
	if ( ! currentUserCan( 'manage_options' ) ) {
		return Promise.resolve();
	}

	if ( ! readyPromise ) {
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
