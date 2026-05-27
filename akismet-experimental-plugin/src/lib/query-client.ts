import { QueryClient } from '@tanstack/react-query';

/**
 * Build a TanStack QueryClient with defaults aligned to the Jetpack monorepo
 * convention (see `akismet-modernization/react-query-conventions.md` §1).
 *
 * Matches Scan + VideoPress in-tree defaults: 30s staleTime, 5min gc, single
 * retry for queries, never retry mutations, no refetch on focus.
 *
 * @return Configured QueryClient instance.
 */
export function createQueryClient(): QueryClient {
	return new QueryClient( {
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				gcTime: 5 * 60_000,
				retry: 1,
				refetchOnWindowFocus: false,
			},
			mutations: {
				// Mutations are explicit user actions; never retry silently.
				retry: false,
			},
		},
	} );
}
