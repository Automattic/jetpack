/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useStatsHourOfDay } from '../use-stats-hour-of-day';
import type { StatsHourOfDayParams } from '../use-stats-hour-of-day';
import type { ReactNode } from 'react';

// The parked comparison key carries no `queryFn` of its own, and react-query
// logs that as an error even while the query is disabled.
const queryClient = new QueryClient( {
	defaultOptions: { queries: { retry: false, queryFn: async () => ( {} ) } },
} );

function wrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

// Comparison-free, the way the widget passes them: the endpoint has no
// comparison period, so its consumer strips those params before calling.
const params = {
	from: '2026-07-14',
	to: '2026-08-12',
	interval: 'day',
} as unknown as StatsHourOfDayParams;

/**
 * @return Every query key currently in the cache.
 */
function cachedKeys() {
	return queryClient
		.getQueryCache()
		.getAll()
		.map( query => query.queryKey );
}

describe( 'useStatsHourOfDay', () => {
	beforeEach( () => {
		queryClient.clear();
	} );

	it( 'parks the comparison query rather than fetching a second range', () => {
		// `enabled: false` keeps both queries off the network while still
		// registering their cache entries.
		renderHook( () => useStatsHourOfDay( params, { enabled: false } ), { wrapper } );

		expect( cachedKeys() ).toContainEqual( [
			'stats',
			'hour-of-day',
			'__comparison__',
			'disabled',
		] );
	} );

	it( 'requests the hour-of-day dimension over the dashboard range', () => {
		renderHook( () => useStatsHourOfDay( params, { enabled: false } ), { wrapper } );

		const primaryKey = cachedKeys().find( key => key[ 1 ] === 'hourOfDay' );

		expect( primaryKey?.[ 3 ] ).toBe( 'stats/views-by/hour-of-day' );
		expect( primaryKey?.[ 5 ] ).toMatchObject( {
			date: '2026-08-12',
			start_date: '2026-07-14',
		} );
	} );
} );
