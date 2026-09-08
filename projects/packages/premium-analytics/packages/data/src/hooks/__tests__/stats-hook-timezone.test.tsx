/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import {
	useStatsEmailClicksTimeSeries,
	useStatsEmailOpensTimeSeries,
} from '../use-stats-email-time-series';
import { useStatsSingleVideo } from '../use-stats-single-video';
import type { StatsEmailTimeSeriesParams } from '../use-stats-email-time-series';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/datetime', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/datetime' ),
	reportingTimeZone: jest.fn( () => 'America/New_York' ),
} ) );

const queryClient = new QueryClient( {
	defaultOptions: { queries: { retry: false, queryFn: async () => ( {} ) } },
} );

function wrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

const params = {
	from: '2026-07-14',
	to: '2026-08-12',
	interval: 'day',
} as unknown as StatsEmailTimeSeriesParams;

// The three hooks return different report shapes, so the cases are narrowed to
// the one field under test before `it.each` has to unify them.
const zoned: [ string, () => { timezone: string } ][] = [
	[
		'useStatsEmailOpensTimeSeries',
		() => useStatsEmailOpensTimeSeries( 1, { ...params, timezone: 'Asia/Taipei' } ),
	],
	[
		'useStatsEmailClicksTimeSeries',
		() => useStatsEmailClicksTimeSeries( 1, { ...params, timezone: 'Asia/Taipei' } ),
	],
	[ 'useStatsSingleVideo', () => useStatsSingleVideo( 1, { ...params, timezone: 'Asia/Taipei' } ) ],
];

// The environment names a different zone from the params on purpose: these hooks
// feed `resolveBucketStamp`, and a widget that read the environment instead would
// shift every bucket by the difference with nothing on screen to show for it.
describe( 'the zone a bucket-reading stats hook surfaces', () => {
	beforeEach( () => {
		queryClient.clear();
	} );

	it.each( zoned )( '%s reports the zone its params named', ( _name, useHook ) => {
		const { result } = renderHook( useHook, { wrapper } );

		expect( result.current.timezone ).toBe( 'Asia/Taipei' );
	} );

	it( 'falls back to the reporting zone only when the params name none', () => {
		const { result } = renderHook( () => useStatsEmailOpensTimeSeries( 1, params ), { wrapper } );

		expect( result.current.timezone ).toBe( 'America/New_York' );
	} );
} );
