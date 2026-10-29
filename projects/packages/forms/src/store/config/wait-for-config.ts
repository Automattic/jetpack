import { resolveSelect, select, subscribe } from '@wordpress/data';
import { store } from './index.ts';
import type { FormsConfigData } from '../../types/index.ts';

/**
 * Resolves with the loaded config, waiting out a fetch already in flight.
 *
 * `resolveSelect().getConfig()` alone returns null in that case; see `isFulfilled` in resolvers.ts.
 *
 * @return The config, or null when the fetch failed.
 */
export async function waitForConfig(): Promise< Partial< FormsConfigData > | null > {
	const config = await resolveSelect( store ).getConfig();

	if ( config || ! select( store ).isConfigLoading() ) {
		return config;
	}

	return new Promise( resolve => {
		const unsubscribe = subscribe( () => {
			if ( ! select( store ).isConfigLoading() ) {
				unsubscribe();
				resolve( select( store ).getConfig() );
			}
		}, store );
	} );
}
