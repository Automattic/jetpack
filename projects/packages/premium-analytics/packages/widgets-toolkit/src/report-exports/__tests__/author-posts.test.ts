/**
 * External dependencies
 */
import { fetchStatsTopAuthorsRows, type ReportParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { authorPostsCsvExporter } from '../authors';
import { getReportCsvFilename } from '../download-report-csv';

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

const fetchStatsTopAuthorsRowsMock = jest.mocked( fetchStatsTopAuthorsRows );

const REPORT_PARAMS = {
	from: '2026-07-01',
	to: '2026-07-07',
	preset: 'all-time',
	author_id: 7,
} as ReportParams;

const post = ( id: number, label: string, views: number ) => ( {
	id,
	label,
	views,
	link: `https://example.com/${ id }/`,
	children: null,
} );

describe( 'authorPostsCsvExporter', () => {
	beforeEach( () => {
		fetchStatsTopAuthorsRowsMock.mockReset();
		fetchStatsTopAuthorsRowsMock.mockResolvedValue( [
			{
				key: 'id:3',
				id: 3,
				label: 'Other',
				views: 90,
				icon: null,
				children: [ post( 9, 'Not hers', 90 ) ],
			},
			{
				key: 'id:7',
				id: 7,
				label: 'José Núñez',
				views: 30,
				icon: null,
				children: [ post( 1, 'Top post', 20 ), post( 2, 'Second post', 10 ) ],
			},
		] as Awaited< ReturnType< typeof fetchStatsTopAuthorsRows > > );
	} );

	it( 'exports every post by the author over the page’s own window, in the report’s order', async () => {
		const exporter = authorPostsCsvExporter( 7, 'José Núñez' );
		const rows = exporter.toCsvRows( await exporter.fetchItems( REPORT_PARAMS ) );

		expect( fetchStatsTopAuthorsRowsMock ).toHaveBeenCalledWith( { ...REPORT_PARAMS, max: 0 } );
		expect( exporter.getColumns().map( column => column.label ) ).toEqual( [
			'Title',
			'Views',
			'URL',
		] );
		expect(
			rows.map( row => exporter.getColumns().map( column => column.getValue( row ) ) )
		).toEqual( [
			[ 'Top post', 20, 'https://example.com/1/' ],
			[ 'Second post', 10, 'https://example.com/2/' ],
		] );
	} );

	it( 'names the file after the author and the page’s window', () => {
		expect( getReportCsvFilename( authorPostsCsvExporter( 7, 'José Núñez' ), REPORT_PARAMS ) ).toBe(
			'author-jose-nunez-posts-2026-07-01_2026-07-07'
		);
		expect( authorPostsCsvExporter( 7, '' ).filenamePrefix ).toBe( 'author-7-posts' );
	} );
} );
