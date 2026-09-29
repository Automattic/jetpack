import { mergeStatsLocationsComparisonRows, sanitizeStatsLocationsResponse } from '..';
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
				mapRegion: '002',
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
			date_start: '2026-06-16T00:00:00',
			date_end: '2026-06-22T23:59:59',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				date_start: '2026-06-16T00:00:00',
				date_end: '2026-06-22T23:59:59',
			} )
		);
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'New Jersey',
				views: 2979,
				countryCode: 'US',
				countryFull: 'United States',
				mapRegion: '021',
			} ),
			expect.objectContaining( {
				label: 'Hong Kong',
				views: 1252,
				countryCode: 'HK',
				countryFull: 'Hong Kong SAR China',
				mapRegion: '030',
			} ),
			expect.objectContaining( {
				label: 'Hungary',
				views: 59,
				countryCode: 'HU',
				countryFull: 'Hungary',
				mapRegion: '151',
			} ),
			expect.objectContaining( {
				label: "Côte d'Ivoire",
				views: 2,
				countryCode: 'CI',
				countryFull: 'Côte d’Ivoire',
				mapRegion: '002',
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
			date_start: '2026-06-16T00:00:00',
			date_end: '2026-06-22T23:59:59',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				date_start: '2026-06-16T00:00:00',
				date_end: '2026-06-22T23:59:59',
			} )
		);
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'North Bergen',
				views: 2716,
				countryCode: 'US',
				countryFull: 'United States',
				mapRegion: '021',
				region: 'New Jersey',
				coordinates: {
					latitude: 40.804077,
					longitude: -74.012366,
				},
			} ),
			expect.objectContaining( {
				label: 'Hong Kong',
				views: 1246,
				countryCode: 'HK',
				countryFull: 'Hong Kong SAR China',
				coordinates: {
					latitude: 22.28552,
					longitude: 114.15769,
				},
			} ),
			expect.objectContaining( {
				label: 'London',
				views: 476,
				countryCode: 'GB',
				countryFull: 'United Kingdom',
				coordinates: {
					latitude: 51.50853,
					longitude: -0.12574,
				},
			} ),
		] );
	} );

	it( 'leaves out coordinates the API sends blank, so the map never plots a city at NaN', () => {
		const result = sanitizeStatsLocationsResponse(
			{
				date: '2026-06-22',
				summary: {
					views: [
						{
							location: 'Nowhere',
							views: 3,
							country_code: 'US',
							coordinates: { latitude: '', longitude: '' },
						},
					],
				},
			},
			{ period: 'day', start_date: '2026-06-16', end_date: '2026-06-22', summarize: true }
		);

		expect( result.data[ 0 ].items[ 0 ].coordinates ).toBeUndefined();
	} );

	it( 'keeps same-named cities in different regions apart when merging periods', () => {
		const query = {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} as const;
		const report = ( minnesota: number, florida: number ) =>
			sanitizeStatsLocationsResponse(
				{
					date: '2026-06-22',
					summary: {
						views: [
							{
								location: 'Saint Cloud',
								region: 'Minnesota',
								views: minnesota,
								country_code: 'US',
							},
							{ location: 'Saint Cloud', region: 'Florida', views: florida, country_code: 'US' },
						],
					},
				},
				query
			);

		const { rows } = mergeStatsLocationsComparisonRows( report( 3, 8 ), report( 5, 2 ) );

		expect( rows.map( row => [ row.region, row.views, row.previousViews ] ) ).toEqual( [
			[ 'Minnesota', 3, 5 ],
			[ 'Florida', 8, 2 ],
		] );
	} );
} );
