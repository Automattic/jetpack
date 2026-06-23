/**
 * Internal dependencies
 */
import { statsLocationsQuery } from '../stats-locations-query';
import { statsTopPostsQuery } from '../stats-top-posts-query';
import type { StatsReportParams } from '../stats-query';

describe( 'Stats query factories', () => {
	it( 'disables report queries until a date range is available', () => {
		expect( statsTopPostsQuery( {} as StatsReportParams ).enabled ).toBe( false );
	} );

	it( 'builds location query keys from geoMode', () => {
		const query = statsLocationsQuery( {
			from: '2026-06-16',
			to: '2026-06-16',
			interval: 'day',
			geoMode: 'city',
		} );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'locations-city',
			'1.1',
			'stats/location-views/city',
			'GET',
			expect.objectContaining( { date: '2026-06-16' } ),
			undefined,
			'locations',
		] );
	} );

	it( 'requests summarized data for multi-day report ranges', () => {
		const query = statsTopPostsQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					date: '2026-06-07',
					start_date: '2026-06-01',
					days: 7,
					summarize: 1,
				} ),
			] )
		);
	} );

	it( 'preserves explicit summarize params', () => {
		const query = statsTopPostsQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
			summarize: false,
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					date: '2026-06-07',
					days: 7,
					summarize: false,
				} ),
			] )
		);
	} );
} );
