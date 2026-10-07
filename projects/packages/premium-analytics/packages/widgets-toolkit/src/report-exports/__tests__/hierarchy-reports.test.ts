/**
 * External dependencies
 */
import {
	fetchStatsClicksRows,
	fetchStatsReferrersRows,
	fetchStatsTopAuthorsRows,
	type ReportParams,
	type StatsReferrersComparisonItem,
	type StatsTopAuthorsComparisonItem,
} from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { authorsCsvExporter, getAuthorsReportQueryParams } from '../authors';
import { clicksCsvExporter } from '../clicks';
import { getSummarizedReportQueryParams } from '../query-params';
import { referrersCsvExporter } from '../referrers';
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

async function exportCsvTable< TItem, TRow >( exporter: ReportCsvExporter< TItem, TRow > ) {
	const columns = exporter.getColumns();
	const rows = exporter.toCsvRows( await exporter.fetchItems( REPORT_PARAMS ) );
	return [
		columns.map( column => column.label ),
		...rows.map( row => columns.map( column => column.getValue( row ) ) ),
	];
}

describe( 'hierarchy report exporters', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'exports Referrers depth-first with each row’s group', async () => {
		jest.mocked( fetchStatsReferrersRows ).mockResolvedValue( [
			{
				label: 'Search',
				views: 10,
				children: [ { label: 'Google', views: 8, link: 'https://google.com/', children: null } ],
			},
			{ label: 'Social', views: 9, children: null },
		] as unknown as StatsReferrersComparisonItem[] );

		await expect( exportCsvTable( referrersCsvExporter ) ).resolves.toEqual( [
			[ 'Referrer', 'Group', 'Views', 'URL' ],
			[ 'Search', '', 10, '' ],
			[ 'Google', 'Search', 8, 'https://google.com/' ],
			[ 'Social', '', 9, '' ],
		] );
	} );

	it( 'exports Authors with each post qualified by its author, naming untracked authors', async () => {
		jest.mocked( fetchStatsTopAuthorsRows ).mockResolvedValue( [
			{
				id: 1,
				label: 'Ana',
				views: 9,
				icon: null,
				children: [ { id: 11, label: 'Hello', views: 4, link: null, children: null } ],
			},
			{
				id: null,
				label: 'Untracked Authors',
				views: 6,
				icon: null,
				children: [ { id: 12, label: 'Orphan', views: 6, link: null, children: null } ],
			},
		] as unknown as StatsTopAuthorsComparisonItem[] );

		await expect( exportCsvTable( authorsCsvExporter ) ).resolves.toEqual( [
			[ 'Author / post', 'Views' ],
			[ 'Ana', 9 ],
			[ 'Ana > Hello', 4 ],
			[ 'Untracked authors', 6 ],
			[ 'Untracked authors > Orphan', 6 ],
		] );
		expect( fetchStatsTopAuthorsRows ).toHaveBeenCalledWith(
			getAuthorsReportQueryParams( REPORT_PARAMS )
		);
		expect( getAuthorsReportQueryParams( REPORT_PARAMS ) ).toEqual( { ...REPORT_PARAMS, max: 0 } );
	} );

	it( 'leaves an all-time Authors window to the WPCOM cap classic Stats shows', () => {
		expect( getAuthorsReportQueryParams( { ...REPORT_PARAMS, preset: 'all-time' } ) ).toMatchObject(
			{ num: -1 }
		);
	} );
} );

describe( 'hierarchy report exporters on a raw Stats payload', () => {
	const actualData = jest.requireActual( '@jetpack-premium-analytics/data' );

	beforeEach( () => {
		jest.clearAllMocks();
		actualData.queryClient.clear();
		jest.mocked( fetchStatsClicksRows ).mockImplementation( actualData.fetchStatsClicksRows );
		jest
			.mocked( fetchStatsTopAuthorsRows )
			.mockImplementation( actualData.fetchStatsTopAuthorsRows );
	} );

	it( 'exports Clicks groups from the clicks endpoint', async () => {
		jest.mocked( apiFetch ).mockResolvedValue( {
			date: '2026-03-10',
			days: {},
			summary: {
				clicks: [
					{
						name: 'wordpress.org',
						views: 5,
						url: null,
						children: [
							{ name: 'wordpress.org/a', views: 3, url: 'https://wordpress.org/a' },
							{ name: 'wordpress.org/b', views: 2, url: 'https://wordpress.org/b' },
						],
					},
					{ name: 'jetpack.com', views: 4, url: 'https://jetpack.com/' },
				],
			},
		} );

		await expect( exportCsvTable( clicksCsvExporter ) ).resolves.toEqual( [
			[ 'Clicked URL', 'Group', 'Clicks' ],
			[ 'wordpress.org', '', 5 ],
			[ 'https://wordpress.org/a', 'wordpress.org', 3 ],
			[ 'https://wordpress.org/b', 'wordpress.org', 2 ],
			[ 'https://jetpack.com/', 'jetpack.com', 4 ],
		] );
		expect( fetchStatsClicksRows ).toHaveBeenCalledWith(
			getSummarizedReportQueryParams( REPORT_PARAMS )
		);
	} );

	it( 'exports Authors and their posts from the top-authors endpoint', async () => {
		jest.mocked( apiFetch ).mockResolvedValue( {
			date: '2026-03-10',
			period: 'day',
			summary: {
				authors: [
					{
						author_id: 1,
						name: 'Ana',
						views: 9,
						posts: [ { id: 11, title: 'Hello', views: 4, url: 'https://example.com/hello/' } ],
					},
				],
			},
		} );

		await expect( exportCsvTable( authorsCsvExporter ) ).resolves.toEqual( [
			[ 'Author / post', 'Views' ],
			[ 'Ana', 9 ],
			[ 'Ana > Hello', 4 ],
		] );
	} );
} );
