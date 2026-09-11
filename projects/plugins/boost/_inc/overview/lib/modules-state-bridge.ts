import type { QueryClient } from '@tanstack/react-query';

export const OVERVIEW_MODULES_CHANGE_EVENT = 'jetpack-boost-overview-modules-change';

const relayedQueryKeys = [ 'modules_state', 'critical_css_state', 'lcp_state' ];

// Register in the legacy bundle, whose Data Sync cache is separate from the route bundle's cache.
export function observeLegacyModulesState( client: QueryClient ) {
	return client.getQueryCache().subscribe( event => {
		if (
			event.type === 'updated' &&
			event.action.type === 'success' &&
			relayedQueryKeys.some( key => event.query.queryKey[ 0 ] === key )
		) {
			window.dispatchEvent( new Event( OVERVIEW_MODULES_CHANGE_EVENT ) );
		}
	} );
}
