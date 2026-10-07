/**
 * External dependencies
 */
import {
	fetchStatsUtmRows,
	type ReportParams,
	type StatsUtmComparisonItem,
	type StatsUtmComparisonTopPostItem,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	aggregateUtmRows,
	getUtmDimensionOptions,
	getUtmReportSection,
	utmCsvExporters,
} from '../utm';

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

/**
 * Build a nested post fixture.
 *
 * @param overrides - Post properties to override.
 * @return The post fixture.
 */
function makePost(
	overrides: Partial< StatsUtmComparisonTopPostItem > = {}
): StatsUtmComparisonTopPostItem {
	return {
		id: 41,
		label: 'Landing page',
		value: 12,
		href: 'https://example.com/landing/',
		page: '/stats/post/41',
		actions: [],
		children: null,
		...overrides,
	};
}

/**
 * Build a UTM comparison-row fixture.
 *
 * @param overrides - UTM properties to override.
 * @return The UTM fixture.
 */
function makeUtmItem( overrides: Partial< StatsUtmComparisonItem > = {} ): StatsUtmComparisonItem {
	return {
		label: 'newsletter / email',
		value: 18,
		paramValues: '["newsletter","email"]',
		children: [ makePost() ],
		...overrides,
	};
}

describe( 'UTM report aggregate', () => {
	it( 'groups posts under their UTM parent', () => {
		const rows = aggregateUtmRows( [ makeUtmItem() ] );
		const [ parent, post ] = rows;

		expect( parent ).toEqual( {
			id: JSON.stringify( [ 'utm', '["newsletter","email"]' ] ),
			label: 'newsletter / email',
			views: 18,
			previousViews: undefined,
			isGroup: true,
		} );
		expect( post ).toEqual(
			expect.objectContaining( {
				parentId: parent.id,
				label: 'Landing page',
				groupLabel: 'newsletter / email',
				postId: 41,
				views: 12,
			} )
		);
	} );

	it( 'preserves comparison values for UTM parents and posts', () => {
		const rows = aggregateUtmRows( [
			makeUtmItem( {
				previousValue: 10,
				children: [ makePost( { previousValue: 8 } ) ],
			} ),
		] );

		expect( rows.map( row => row.previousViews ) ).toEqual( [ 10, 8 ] );
	} );

	it( 'keeps distinct UTM tuples separate when their labels collide', () => {
		const rows = aggregateUtmRows( [
			makeUtmItem( {
				label: 'a / b / c',
				paramValues: '["a / b","c"]',
				children: null,
			} ),
			makeUtmItem( {
				label: 'a / b / c',
				paramValues: '["a","b / c"]',
				children: null,
			} ),
		] );

		expect( rows ).toHaveLength( 2 );
		expect( rows[ 0 ].id ).not.toBe( rows[ 1 ].id );
	} );

	it( 'keeps UTM parents that have no posts', () => {
		expect( aggregateUtmRows( [ makeUtmItem( { children: null } ) ] ) ).toEqual( [
			expect.objectContaining( {
				label: 'newsletter / email',
				views: 18,
				isGroup: true,
			} ),
		] );
	} );
} );

const UTM_DIMENSIONS = [
	[ 'source-medium', 'utm_source,utm_medium', 'Source / Medium' ],
	[ 'campaign-source-medium', 'utm_campaign,utm_source,utm_medium', 'Campaign / Source / Medium' ],
	[ 'source', 'utm_source', 'Source' ],
	[ 'medium', 'utm_medium', 'Medium' ],
	[ 'campaign', 'utm_campaign', 'Campaign' ],
] as const;

describe( 'utmCsvExporters', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( UTM_DIMENSIONS )( 'exports the full %s report', async ( section, utmParam, label ) => {
		jest.mocked( fetchStatsUtmRows ).mockResolvedValue( [ makeUtmItem() ] );
		const exporter = utmCsvExporters[ section ];

		const rows = exporter.toCsvRows( await exporter.fetchItems( REPORT_PARAMS ) );
		const columns = exporter.getColumns();

		expect( fetchStatsUtmRows ).toHaveBeenCalledWith( {
			...REPORT_PARAMS,
			max: 0,
			summarize: 0,
			query_top_posts: true,
			utmParam,
		} );
		expect( getUtmReportSection( utmParam ) ).toBe( section );
		expect( exporter.filenamePrefix ).toBe( `utm-${ section }` );
		expect( columns.map( column => column.label ) ).toEqual( [ label, 'Views' ] );
		expect( rows.map( row => columns.map( column => column.getValue( row ) ) ) ).toEqual( [
			[ 'newsletter / email', 18 ],
			[ 'newsletter / email > Landing page', 12 ],
		] );
	} );
} );

describe( 'getUtmDimensionOptions', () => {
	it( 'lists every dimension in report tab order', () => {
		expect( getUtmDimensionOptions() ).toEqual(
			UTM_DIMENSIONS.map( ( [ , value, label ] ) => ( { label, value } ) )
		);
	} );
} );
