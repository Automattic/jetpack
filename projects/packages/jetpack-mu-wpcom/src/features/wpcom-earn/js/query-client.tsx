import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const CLIENT_KEY = '__wpcomEarnQueryClient' as const;

declare global {
	interface Window {
		[ CLIENT_KEY ]?: QueryClient;
	}
}

/**
 * The one client every Monetize route renders against.
 *
 * Parked on `window` because each wp-build route bundles its own copy of this module,
 * which would otherwise leave every tab with its own cold cache.
 *
 * @return The shared client, created on first use.
 */
function sharedClient(): QueryClient {
	window[ CLIENT_KEY ] ??= new QueryClient( {
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				retry: 1,
				refetchOnWindowFocus: false,
			},
		},
	} );

	return window[ CLIENT_KEY ];
}

/**
 * Provides the shared query client to a route's stage.
 *
 * @param props          - Component props.
 * @param props.children - The stage's content.
 * @return The provider.
 */
export function EarnQueryClientProvider( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ sharedClient() }>{ children }</QueryClientProvider>;
}
