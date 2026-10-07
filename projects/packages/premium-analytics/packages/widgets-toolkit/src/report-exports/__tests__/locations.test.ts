/**
 * External dependencies
 */
import {
	fetchStatsLocationsRows,
	type ReportParams,
	type StatsLocationsComparisonItem,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { buildLocationRows, locationsCsvExporter } from '../locations';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	fetchStatsClicksRows: jest.fn(),
	fetchStatsComments: jest.fn(),
	fetchStatsEmailSummaryRows: jest.fn(),
	fetchStatsFileDownloadsRows: jest.fn(),
	fetchStatsInsightsYears: jest.fn(),
	fetchStatsLocationsRows: jest.fn(),
	fetchStatsReferrersRows: jest.fn(),
	fetchStatsSearchTermsReport: jest.fn(),
	fetchStatsTagsRows: jest.fn(),
	fetchStatsTopAuthorsRows: jest.fn(),
	fetchStatsUtmRows: jest.fn(),
	fetchStatsVideoPlaysRows: jest.fn(),
} ) );

const fetchStatsLocationsRowsMock = jest.mocked( fetchStatsLocationsRows );

const REPORT_PARAMS = { from: '2026-03-01', to: '2026-03-10' } as ReportParams;

const items: StatsLocationsComparisonItem[] = [
	{
		label: 'Springfield',
		views: 13,
		countryCode: 'US',
		countryFull: 'United States',
		children: null,
		previousViews: 9,
	},
	{
		label: 'Springfield',
		views: 3,
		countryCode: 'CA',
		countryFull: 'Canada',
		children: null,
	},
];

describe( 'buildLocationRows', () => {
	it( 'keeps identical names in different countries apart', () => {
		expect( buildLocationRows( items ) ).toEqual( [
			{
				id: 'US:Springfield',
				label: 'Springfield',
				countryCode: 'US',
				countryFull: 'United States',
				views: 13,
				previousViews: 9,
			},
			{
				id: 'CA:Springfield',
				label: 'Springfield',
				countryCode: 'CA',
				countryFull: 'Canada',
				views: 3,
				previousViews: undefined,
			},
		] );
	} );

	it( 'returns no rows when the report has not arrived', () => {
		expect( buildLocationRows( undefined ) ).toEqual( [] );
	} );
} );

describe( 'locationsCsvExporter', () => {
	beforeEach( () => {
		fetchStatsLocationsRowsMock.mockReset();
		fetchStatsLocationsRowsMock.mockResolvedValue( [ items[ 1 ], items[ 0 ] ] );
	} );

	it.each( [
		[ 'countries', 'country', [ 'Location', 'Views' ] ],
		[ 'regions', 'region', [ 'Location', 'Country', 'Views' ] ],
		[ 'cities', 'city', [ 'Location', 'Country', 'Views' ] ],
	] as const )( 'exports every %s row', async ( section, geoMode, columns ) => {
		const exporter = locationsCsvExporter( section );
		const rows = exporter.toCsvRows( await exporter.fetchItems( REPORT_PARAMS ) );

		expect( fetchStatsLocationsRowsMock ).toHaveBeenCalledWith( {
			...REPORT_PARAMS,
			max: 0,
			summarize: 1,
			period: 'day',
			geoMode,
		} );
		expect( exporter.filenamePrefix ).toBe( `locations-${ section }` );
		expect( exporter.getColumns().map( column => column.label ) ).toEqual( columns );
		expect( rows.map( row => [ row.label, row.countryFull, row.views ] ) ).toEqual( [
			[ 'Springfield', 'United States', 13 ],
			[ 'Springfield', 'Canada', 3 ],
		] );
	} );

	it( 'names the country of each region and city row', async () => {
		const exporter = locationsCsvExporter( 'cities' );
		const [ first ] = exporter.toCsvRows( await exporter.fetchItems( REPORT_PARAMS ) );

		expect( exporter.getColumns().map( column => column.getValue( first ) ) ).toEqual( [
			'Springfield',
			'United States',
			13,
		] );
	} );

	it( 'scopes the request to a country, and to a region inside it', async () => {
		await locationsCsvExporter( 'regions', { country: 'US' } ).fetchItems( REPORT_PARAMS );
		await locationsCsvExporter( 'cities', { country: 'US', region: 'Minnesota' } ).fetchItems(
			REPORT_PARAMS
		);

		const [ [ regions ], [ cities ] ] = fetchStatsLocationsRowsMock.mock.calls;
		expect( regions ).toMatchObject( { geoMode: 'region', filter_by_country: 'US' } );
		expect( regions ).not.toHaveProperty( 'filter_by_region' );
		expect( cities ).toMatchObject( {
			geoMode: 'city',
			filter_by_country: 'US',
			filter_by_region: 'Minnesota',
		} );
	} );

	it( 'names the file after the scope', () => {
		expect( locationsCsvExporter( 'regions', { country: 'FR' } ).filenamePrefix ).toBe(
			'locations-regions-fr'
		);
		expect(
			locationsCsvExporter( 'cities', { country: 'FR', region: 'Île-de-France' } ).filenamePrefix
		).toBe( 'locations-cities-fr-ile-de-france' );
	} );
} );
