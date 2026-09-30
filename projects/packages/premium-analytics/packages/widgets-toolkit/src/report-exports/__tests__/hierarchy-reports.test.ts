/**
 * External dependencies
 */
import {
	fetchStatsClicksRows,
	fetchStatsReferrersRows,
	fetchStatsTopAuthorsRows,
	type ReportParams,
	type StatsClicksComparisonItem,
	type StatsReferrersComparisonItem,
	type StatsTopAuthorsComparisonItem,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { authorsCsvExporter, getAuthorsReportQueryParams } from '../authors';
import { clicksCsvExporter } from '../clicks';
import { getSummarizedReportQueryParams } from '../query-params';
import { referrersCsvExporter } from '../referrers';
import type { ReportCsvExporter } from '../types';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	fetchStatsClicksRows: jest.fn(),
	fetchStatsReferrersRows: jest.fn(),
	fetchStatsTopAuthorsRows: jest.fn(),
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
	it( 'exports Clicks groups before their URLs, naming each URL group', async () => {
		jest.mocked( fetchStatsClicksRows ).mockResolvedValue( [
			{
				label: 'wordpress.org',
				views: 5,
				children: [
					{
						label: 'wordpress.org/a',
						views: 3,
						link: 'https://wordpress.org/a',
						children: null,
					},
					{
						label: 'wordpress.org/b',
						views: 2,
						link: 'https://wordpress.org/b',
						children: null,
					},
				],
			},
			{ label: 'jetpack.com', views: 4, link: 'https://jetpack.com/', children: null },
		] as unknown as StatsClicksComparisonItem[] );

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
		expect( clicksCsvExporter ).toMatchObject( { filenamePrefix: 'clicks', hasDateRange: true } );
	} );

	it( 'exports Referrers depth-first with each row’s group', async () => {
		jest.mocked( fetchStatsReferrersRows ).mockResolvedValue( [
			{
				label: 'Search',
				views: 10,
				children: [ { label: 'Google', views: 8, link: 'https://google.com/', children: null } ],
			},
			{ label: 'Social', views: 4, children: null },
		] as unknown as StatsReferrersComparisonItem[] );

		await expect( exportCsvTable( referrersCsvExporter ) ).resolves.toEqual( [
			[ 'Referrer', 'Group', 'Views', 'URL' ],
			[ 'Search', '', 10, '' ],
			[ 'Google', 'Search', 8, 'https://google.com/' ],
			[ 'Social', '', 4, '' ],
		] );
		expect( referrersCsvExporter ).toMatchObject( {
			filenamePrefix: 'referrers',
			hasDateRange: true,
		} );
	} );

	it( 'exports Authors with each post qualified by its author', async () => {
		jest.mocked( fetchStatsTopAuthorsRows ).mockResolvedValue( [
			{
				id: 1,
				label: 'Ana',
				views: 9,
				icon: null,
				children: [ { id: 11, label: 'Hello', views: 9, link: null, children: null } ],
			},
			{ id: null, label: 'Untracked Authors', views: 2, icon: null, children: null },
		] as unknown as StatsTopAuthorsComparisonItem[] );

		await expect( exportCsvTable( authorsCsvExporter ) ).resolves.toEqual( [
			[ 'Author / post', 'Views' ],
			[ 'Ana', 9 ],
			[ 'Ana > Hello', 9 ],
			[ 'Untracked authors', 2 ],
		] );
		expect( fetchStatsTopAuthorsRows ).toHaveBeenCalledWith(
			getAuthorsReportQueryParams( REPORT_PARAMS )
		);
		expect( getAuthorsReportQueryParams( REPORT_PARAMS ) ).toEqual( { ...REPORT_PARAMS, max: 0 } );
		expect( authorsCsvExporter ).toMatchObject( {
			filenamePrefix: 'top-authors',
			hasDateRange: true,
		} );
	} );
} );
