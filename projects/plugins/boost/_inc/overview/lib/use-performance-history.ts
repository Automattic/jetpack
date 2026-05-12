import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { z } from 'zod';
import { buildMockHistory, isMockMode } from './mock-mode';

declare global {
	// Localized by the Boost wp-js-data-sync wiring; carries each entry's
	// REST URL + per-route authenticated nonce.
	const jetpack_boost_ds:
		| {
				performance_history?: { value?: unknown; nonce?: string };
		  }
		| undefined;
}

const periodSchema = z.object( {
	timestamp: z.number(),
	dimensions: z.object( {
		desktop_overall_score: z.number(),
		mobile_overall_score: z.number(),
	} ),
} );

const performanceHistoryDataSchema = z
	.object( {
		periods: z.array( periodSchema ),
		startDate: z.number(),
		endDate: z.number(),
	} )
	.nullable();

export type PerformanceHistoryData = z.infer< typeof performanceHistoryDataSchema >;
export type PerformanceHistoryPeriod = z.infer< typeof periodSchema >;

// The data-sync REST envelope wraps the entry payload inside a `JSON` field.
const wireSchema = z.object( {
	JSON: performanceHistoryDataSchema,
} );

/**
 * Fetches the cached performance-history time series.
 *
 * Hits the same data-sync REST endpoint the legacy
 * `useDataSync('jetpack_boost_ds', 'performance_history', ...)` hook calls,
 * but via `@wordpress/api-fetch` directly so the wp-build bundle stays
 * decoupled from `@automattic/jetpack-react-data-sync-client` (which would
 * otherwise ship a second copy of React Query and split the context).
 *
 * `staleTime: 12h` matches the legacy hook so we don't refetch on every
 * tab switch.
 *
 * @return React Query state for the performance history entry.
 */
export function usePerformanceHistory() {
	return useQuery( {
		queryKey: [ 'performance_history' ],
		queryFn: async (): Promise< PerformanceHistoryData > => {
			if ( isMockMode() ) {
				return buildMockHistory();
			}
			// Data-sync sanitizes underscores to hyphens for both the
			// namespace (`jetpack_boost_ds` → `jetpack-boost-ds`) and the
			// entry key (`performance_history` → `performance-history`).
			// The endpoint enforces a per-route `X-Jetpack-WP-JS-Sync-Nonce`
			// header that the data-sync bootstrap localizes onto the
			// `window.jetpack_boost_ds` namespace.
			const nonce = jetpack_boost_ds?.performance_history?.nonce ?? '';
			const raw = await apiFetch( {
				path: '/jetpack-boost-ds/performance-history',
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': nonce },
			} );
			const parsed = wireSchema.safeParse( raw );
			if ( ! parsed.success ) {
				return null;
			}
			return parsed.data.JSON;
		},
		staleTime: 12 * 60 * 60 * 1000,
	} );
}
