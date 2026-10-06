/**
 * External dependencies
 */
import {
	fetchStatsFileDownloadsRows,
	fetchStatsSearchTermsReport,
	fetchStatsVideoPlaysRows,
	type ReportParams,
	type StatsFileDownloadsComparisonItem,
	type StatsVideoPlaysComparisonItem,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { fileDownloadsCsvExporter } from '../file-downloads';
import { getSummarizedReportQueryParams } from '../query-params';
import { searchTermsCsvExporter, type SearchTermRow } from '../search-terms';
import { videosCsvExporter } from '../videos';
import type { ReportCsvExporter } from '../types';

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

const REPORT_PARAMS = { from: '2026-03-01', to: '2026-03-10', interval: 'day' } as ReportParams;

function toCsvTable< TItem, TRow >( exporter: ReportCsvExporter< TItem, TRow >, items: TItem[] ) {
	const columns = exporter.getColumns();
	return [
		columns.map( column => column.label ),
		...exporter.toCsvRows( items ).map( row => columns.map( column => column.getValue( row ) ) ),
	];
}

describe( 'flat report exporters', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'requests every row of a summarized day range', () => {
		expect( getSummarizedReportQueryParams( REPORT_PARAMS ) ).toEqual( {
			...REPORT_PARAMS,
			max: 0,
			summarize: 1,
			period: 'day',
		} );
	} );

	it( 'exports File downloads by downloads, with File, Downloads, and URL', async () => {
		const items = [
			{ label: '/a.pdf', shortLabel: 'a.pdf', downloads: 2, link: '/a.pdf' },
			{ label: '/b', downloads: 9, link: null },
		] as unknown as StatsFileDownloadsComparisonItem[];
		jest.mocked( fetchStatsFileDownloadsRows ).mockResolvedValue( items );

		await expect( fileDownloadsCsvExporter.fetchItems( REPORT_PARAMS ) ).resolves.toBe( items );
		expect( fetchStatsFileDownloadsRows ).toHaveBeenCalledWith(
			getSummarizedReportQueryParams( REPORT_PARAMS )
		);
		expect( toCsvTable( fileDownloadsCsvExporter, items ) ).toEqual( [
			[ 'File', 'Downloads', 'URL' ],
			[ '/b', 9, '' ],
			[ 'a.pdf', 2, '/a.pdf' ],
		] );
	} );

	it( 'aggregates Search terms with the Unknown row and ranks them by views', async () => {
		jest.mocked( fetchStatsSearchTermsReport ).mockResolvedValue( {
			summary: { encrypted_search_terms: 7 },
			data: [ { items: [ { label: 'jetpack', views: 3, children: null } ] } ],
		} as unknown as Awaited< ReturnType< typeof fetchStatsSearchTermsReport > > );

		const items: SearchTermRow[] = await searchTermsCsvExporter.fetchItems( REPORT_PARAMS );

		expect( fetchStatsSearchTermsReport ).toHaveBeenCalledWith(
			getSummarizedReportQueryParams( REPORT_PARAMS )
		);
		expect( toCsvTable( searchTermsCsvExporter, items ) ).toEqual( [
			[ 'Search term', 'Views' ],
			[ 'Unknown search terms', 7 ],
			[ 'jetpack', 3 ],
		] );
	} );

	it( 'exports Videos by plays, naming untitled videos', async () => {
		const items = [
			{
				id: 1,
				label: '',
				plays: 1,
				impressions: 4,
				watch_time: 0.5,
				retention_rate: 20,
				link: null,
			},
			{
				id: 2,
				label: 'Intro',
				plays: 5,
				impressions: 9,
				watch_time: 2,
				retention_rate: 60,
				link: 'https://example.com/v/',
			},
		] as unknown as StatsVideoPlaysComparisonItem[];
		jest.mocked( fetchStatsVideoPlaysRows ).mockResolvedValue( items );

		await videosCsvExporter.fetchItems( REPORT_PARAMS );

		expect( fetchStatsVideoPlaysRows ).toHaveBeenCalledWith( {
			...REPORT_PARAMS,
			max: 0,
			summarize: 1,
			complete_stats: 1,
		} );
		expect( toCsvTable( videosCsvExporter, items ) ).toEqual( [
			[
				'Video ID',
				'Video',
				'Plays',
				'Impressions',
				'Watch time (hours)',
				'Retention rate (%)',
				'URL',
			],
			[ 2, 'Intro', 5, 9, 2, 60, 'https://example.com/v/' ],
			[ 1, 'Untitled video', 1, 4, 0.5, 20, '' ],
		] );
	} );

	it( 'sorts copies, leaving the report rows in their table order', () => {
		const items = [
			{ id: 'a', term: 'a', views: 1 },
			{ id: 'b', term: 'b', views: 2 },
		];

		searchTermsCsvExporter.toCsvRows( items );

		expect( items.map( item => item.id ) ).toEqual( [ 'a', 'b' ] );
	} );
} );
