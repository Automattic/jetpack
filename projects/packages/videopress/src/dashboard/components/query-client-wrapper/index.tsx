import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const STORE_KEY = '__jetpackVideopressQueryClient' as const;

declare global {
	interface Window {
		[ STORE_KEY ]?: QueryClient;
	}
}

/**
 * Returns the singleton QueryClient for the VideoPress dashboard.
 *
 * The client is attached to `window` so that all lazy-loaded wp-build route
 * bundles share one cache instance across navigations.
 *
 * @return {QueryClient} The shared QueryClient instance.
 */
function getClient(): QueryClient {
	if ( ! window[ STORE_KEY ] ) {
		window[ STORE_KEY ] = new QueryClient( {
			defaultOptions: {
				queries: {
					staleTime: 30_000,
					retry: 1,
					refetchOnWindowFocus: false,
				},
			},
		} );
	}
	return window[ STORE_KEY ];
}

const QueryClientWrapper = ( { children }: { children: ReactNode } ) => (
	<QueryClientProvider client={ getClient() }>{ children }</QueryClientProvider>
);

export default QueryClientWrapper;
export { getClient as getVideopressQueryClient };
