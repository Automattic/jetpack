import { QueryClient } from '@tanstack/react-query';

/**
 * Build a TanStack QueryClient with defaults tuned for Akismet's data shape.
 *
 * @return Configured QueryClient instance.
 */
export function createQueryClient(): QueryClient {
	return new QueryClient( {
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				gcTime: 5 * 60_000,
				retry: 2,
				refetchOnWindowFocus: false,
			},
		},
	} );
}
