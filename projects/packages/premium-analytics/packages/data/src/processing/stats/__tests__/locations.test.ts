import { sanitizeStatsLocationsResponse } from '..';
import {
	locationsCitySummaryFixture,
	locationsFixture,
	locationsSummaryFixture,
} from '../__fixtures__/locations';

describe( 'Stats locations normalizer', () => {
	it( 'normalizes location labels with multiple apostrophes', () => {
		const result = sanitizeStatsLocationsResponse( locationsFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: "Côte d'Ivoire's",
				views: 7,
				region: '002',
			} )
		);
		expect( result.summary ).toEqual( {} );
	} );

	it( 'normalizes summarized locations into range data', () => {
		const result = sanitizeStatsLocationsResponse( locationsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			total_views: 0,
			other_views: 0,
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
			} )
		);
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'New Jersey',
				views: 2979,
				countryCode: 'US',
				countryFull: 'United States',
				region: '021',
			} ),
			expect.objectContaining( {
				label: 'Hong Kong',
				views: 1252,
				countryCode: 'HK',
				countryFull: 'Hong Kong SAR China',
				region: '030',
			} ),
			expect.objectContaining( {
				label: 'Hungary',
				views: 59,
				countryCode: 'HU',
				countryFull: 'Hungary',
				region: '151',
			} ),
			expect.objectContaining( {
				label: "Côte d'Ivoire",
				views: 2,
				countryCode: 'CI',
				countryFull: 'Côte d’Ivoire',
				region: '002',
			} ),
		] );
	} );

	it( 'normalizes summarized city locations with coordinates', () => {
		const result = sanitizeStatsLocationsResponse( locationsCitySummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			total_views: 0,
			other_views: 0,
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
			} )
		);
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'North Bergen',
				views: 2716,
				countryCode: 'US',
				countryFull: 'United States',
				region: '021',
				coordinates: {
					latitude: '40.804077',
					longitude: '-74.012366',
				},
			} ),
			expect.objectContaining( {
				label: 'Hong Kong',
				views: 1246,
				countryCode: 'HK',
				countryFull: 'Hong Kong SAR China',
				coordinates: {
					latitude: '22.28552',
					longitude: '114.15769',
				},
			} ),
			expect.objectContaining( {
				label: 'London',
				views: 476,
				countryCode: 'GB',
				countryFull: 'United Kingdom',
				coordinates: {
					latitude: '51.50853',
					longitude: '-0.12574',
				},
			} ),
		] );
	} );
} );
