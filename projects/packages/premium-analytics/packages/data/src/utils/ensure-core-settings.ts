/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';

let readyPromise: Promise< void > | null = null;

/**
 * Ensures that 'site' and 'general settings' are in the coreStore.
 * Memoizes the same promise to avoid races and duplicate requests.
 *
 * A rejected result is not cached: on failure the memo is cleared so the next
 * call retries, otherwise one transient error (network blip, 401, …) would
 * wedge every later caller until a full page reload.
 */
export function ensureCoreSettingsReady(): Promise< void > {
	if ( ! readyPromise ) {
		readyPromise = Promise.all( [
			resolveSelect( coreStore ).getEntityRecord( 'root', 'site' ),
			resolveSelect( coreStore ).getEntityRecord( 'root', 'settings', 'general' ),
		] )
			.then( () => void 0 )
			.catch( err => {
				readyPromise = null;
				throw err;
			} );
	}
	return readyPromise;
}
