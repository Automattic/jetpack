/**
 * External dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

let readyPromise: Promise< void > | null = null;

/**
 * Ensures that 'site' and 'general settings' are in the coreStore.
 * Memoizes the same promise to avoid races and duplicate requests.
 */
export function ensureCoreSettingsReady(): Promise< void > {
	if ( ! readyPromise ) {
		readyPromise = Promise.all( [
			resolveSelect( coreStore ).getEntityRecord( 'root', 'site' ),
			resolveSelect( coreStore ).getEntityRecord(
				'root',
				'settings',
				'general'
			),
		] ).then( () => void 0 );
	}
	return readyPromise;
}
