/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Create a QueryClient configured for test environments: no retries, no
 * cache, and zero stale time so each test starts from a clean state.
 *
 * @return A fresh QueryClient instance suitable for use in tests.
 */
export function createTestQueryClient(): QueryClient {
	return new QueryClient( {
		defaultOptions: {
			queries: { retry: false, gcTime: 0, staleTime: 0 },
			mutations: { retry: false },
		},
	} );
}

/**
 * Return a wrapper component that provides a QueryClientProvider. Pass a
 * pre-created client to share state across multiple hooks in one test; omit
 * it to get a fresh isolated client.
 *
 * @param client - Optional QueryClient; defaults to a new test client.
 * @return A React component that wraps its children in QueryClientProvider.
 */
export function createTestWrapper( client: QueryClient = createTestQueryClient() ) {
	return ( { children }: { children: ReactNode } ) => (
		<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
	);
}
