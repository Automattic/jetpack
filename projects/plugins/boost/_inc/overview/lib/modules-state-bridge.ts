import type { QueryClient } from '@tanstack/react-query';

export const OVERVIEW_MODULES_CHANGE_EVENT = 'jetpack-boost-overview-modules-change';

// Register in the legacy bundle, whose Data Sync cache is separate from the route bundle's cache.
export function observeLegacyModulesState( client: QueryClient ) {
	return client.getQueryCache().subscribe( event => {
		if (
			event.type === 'updated' &&
			event.action.type === 'success' &&
			event.query.queryKey[ 0 ] === 'modules_state'
		) {
			window.dispatchEvent( new Event( OVERVIEW_MODULES_CHANGE_EVENT ) );
		}
	} );
}
