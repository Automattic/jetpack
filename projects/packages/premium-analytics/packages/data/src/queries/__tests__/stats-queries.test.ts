/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from '../stats-app-query';
import { statsArchivesQuery } from '../stats-archives-query';
import { statsLocationsQuery } from '../stats-locations-query';
import { statsTopPostsQuery } from '../stats-top-posts-query';
import { statsVisitsQuery } from '../stats-visits-query';
import type { StatsReportParams } from '../stats-query';

describe( 'Stats query factories', () => {
	it( 'disables report queries until a date range is available', () => {
		expect( statsTopPostsQuery( {} as StatsReportParams ).enabled ).toBe( false );
	} );

	it( 'includes filter_by_country in query params when provided', () => {
		const query = statsLocationsQuery( {
			from: '2026-06-16',
			to: '2026-06-16',
			interval: 'day',
			geoMode: 'region',
			filter_by_country: 'US',
		} );

		expect( query.queryKey ).toEqual( [
			'stats',
			'locations-region',
			'1.1',
			'stats/location-views/region',
			'GET',
			expect.objectContaining( { filter_by_country: 'US' } ),
			undefined,
			'locations',
		] );
	} );

	it( 'omits filter_by_country from query params when not provided', () => {
		const query = statsLocationsQuery( {
			from: '2026-06-16',
			to: '2026-06-16',
			interval: 'day',
			geoMode: 'country',
		} );

		expect( query.queryKey[ 5 ] ).not.toHaveProperty( 'filter_by_country' );
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

	it( 'requests summarized archives data for multi-day ranges', () => {
		const query = statsArchivesQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				'stats/archives',
				expect.objectContaining( {
					date: '2026-06-07',
					start_date: '2026-06-01',
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

	it( 'builds app query keys without report param coercion', () => {
		const query = statsAppProxyQuery( {
			name: 'plan-usage',
			version: '2',
			endpoint: 'stats-app/plan-usage',
			params: { date: '2026-06-16' },
		} );

		expect( query.queryKey ).toEqual( [
			'stats-app',
			'plan-usage',
			'2',
			'stats-app/plan-usage',
			'GET',
			{ date: '2026-06-16' },
			{},
		] );
	} );

	it( 'shares app query keys for empty and omitted params', () => {
		expect(
			statsAppProxyQuery( {
				name: 'purchases',
				version: '1.1',
				endpoint: 'stats-app/purchases',
			} ).queryKey
		).toEqual(
			statsAppProxyQuery( {
				name: 'purchases',
				version: '1.1',
				endpoint: 'stats-app/purchases',
				params: {},
			} ).queryKey
		);
	} );

	it( 'sets visits quantity for day ranges', () => {
		const query = statsVisitsQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					unit: 'day',
					date: '2026-06-07',
					start_date: '2026-06-01',
					quantity: 7,
				} ),
			] )
		);
	} );

	it( 'omits visits quantity for non-day ranges', () => {
		const query = statsVisitsQuery( {
			from: '2026-06-01',
			to: '2026-06-30',
			interval: 'month',
		} );
		const apiParams = query.queryKey[ 5 ] as Record< string, unknown >;

		expect( apiParams ).toEqual(
			expect.objectContaining( {
				unit: 'month',
				date: '2026-06-30',
				start_date: '2026-06-01',
			} )
		);
		expect( apiParams ).not.toHaveProperty( 'quantity' );
	} );
} );
