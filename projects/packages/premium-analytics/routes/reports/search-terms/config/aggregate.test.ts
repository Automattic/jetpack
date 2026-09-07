import { aggregateSearchTermRows } from './aggregate';
import type { StatsNormalizedReport, StatsSearchTermsItem } from '@jetpack-premium-analytics/data';

describe( 'report search terms aggregate', () => {
	const report: StatsNormalizedReport< StatsSearchTermsItem > = {
		summary: {},
		data: [
			{
				time_interval: '2026-06-03',
				date_start: '2026-06-03T00:00:00+00:00',
				date_end: '2026-06-03T23:59:59+00:00',
				items: [
					{
						label: 'wordpress analytics',
						views: 3,
						className: 'user-selectable',
						children: null,
					},
					{
						label: 'jetpack stats',
						views: 2,
						className: 'user-selectable',
						children: null,
					},
				],
				encrypted_search_terms: 4,
			},
			{
				time_interval: '2026-06-04',
				date_start: '2026-06-04T00:00:00+00:00',
				date_end: '2026-06-04T23:59:59+00:00',
				items: [
					{
						label: 'wordpress analytics',
						views: 5,
						className: 'user-selectable',
						children: null,
					},
				],
				encrypted_search_terms: 6,
			},
		],
	};

	it( 'aggregates known terms and renders encrypted searches as a regular row', () => {
		expect( aggregateSearchTermRows( report, 'Unknown search terms' ) ).toEqual( {
			rows: [
				{ id: 'term:wordpress analytics', term: 'wordpress analytics', views: 8 },
				{ id: 'term:jetpack stats', term: 'jetpack stats', views: 2 },
				{ id: 'unknown-search-terms', term: 'Unknown search terms', views: 10 },
			],
			hasComparison: false,
		} );
	} );

	it( 'uses the summarized encrypted count without folding other terms into Unknown', () => {
		const summarizedReport: StatsNormalizedReport< StatsSearchTermsItem > = {
			summary: {
				encrypted_search_terms: 12,
				other_search_terms: 99,
			},
			data: [
				{
					...report.data[ 0 ],
					items: [
						{
							label: 'wordpress analytics',
							views: 8,
							className: 'user-selectable',
							children: null,
						},
					],
					// Summary metadata is authoritative when both shapes are present.
					encrypted_search_terms: 4,
				},
			],
		};

		expect( aggregateSearchTermRows( summarizedReport, 'Unknown search terms' ).rows ).toEqual( [
			{ id: 'term:wordpress analytics', term: 'wordpress analytics', views: 8 },
			{ id: 'unknown-search-terms', term: 'Unknown search terms', views: 12 },
		] );
	} );

	it( 'omits the unknown row when encrypted search counts are all zero', () => {
		const emptyReport = {
			...report,
			data: report.data.map( point => ( {
				...point,
				items: [],
				encrypted_search_terms: 0,
			} ) ),
		};

		expect( aggregateSearchTermRows( emptyReport, 'Unknown search terms' ).rows ).toEqual( [] );
	} );

	it( 'omits the unknown row when the payload has no encrypted aggregate', () => {
		const reportWithoutEncrypted = {
			...report,
			data: report.data.map( point => {
				const { encrypted_search_terms, ...rest } = point;
				void encrypted_search_terms;
				return rest;
			} ),
		};

		expect(
			aggregateSearchTermRows( reportWithoutEncrypted, 'Unknown search terms' ).rows
		).toHaveLength( 2 );
	} );

	it( 'matches known and encrypted rows and treats absent known terms as zero', () => {
		const comparisonReport: StatsNormalizedReport< StatsSearchTermsItem > = {
			summary: {},
			data: [
				{
					...report.data[ 0 ],
					items: [
						{
							label: 'wordpress analytics',
							views: 1,
							className: 'user-selectable',
							children: null,
						},
						{
							label: 'comparison-only term',
							views: 9,
							className: 'user-selectable',
							children: null,
						},
					],
					encrypted_search_terms: 2,
				},
				{
					...report.data[ 1 ],
					items: [
						{
							label: 'wordpress analytics',
							views: 3,
							className: 'user-selectable',
							children: null,
						},
					],
					encrypted_search_terms: 3,
				},
			],
		};

		expect( aggregateSearchTermRows( report, 'Unknown search terms', comparisonReport ) ).toEqual( {
			rows: [
				{
					id: 'term:wordpress analytics',
					term: 'wordpress analytics',
					views: 8,
					previousViews: 4,
				},
				{
					id: 'term:jetpack stats',
					term: 'jetpack stats',
					views: 2,
					previousViews: 0,
				},
				{
					id: 'unknown-search-terms',
					term: 'Unknown search terms',
					views: 10,
					previousViews: 5,
				},
			],
			hasComparison: true,
		} );
	} );

	it( 'preserves an explicit zero for the encrypted comparison aggregate', () => {
		const zeroComparisonReport: StatsNormalizedReport< StatsSearchTermsItem > = {
			summary: {},
			data: report.data.map( point => ( {
				...point,
				items: [],
				encrypted_search_terms: 0,
			} ) ),
		};
		const result = aggregateSearchTermRows( report, 'Unknown search terms', zeroComparisonReport );

		expect( result.rows ).toContainEqual( {
			id: 'unknown-search-terms',
			term: 'Unknown search terms',
			views: 10,
			previousViews: 0,
		} );
		expect( result.hasComparison ).toBe( true );
	} );

	it( 'treats an empty settled comparison report as zero for every primary row', () => {
		const emptyComparisonReport: StatsNormalizedReport< StatsSearchTermsItem > = {
			summary: { encrypted_search_terms: 0 },
			data: [],
		};

		expect(
			aggregateSearchTermRows( report, 'Unknown search terms', emptyComparisonReport )
		).toEqual( {
			rows: [
				{
					id: 'term:wordpress analytics',
					term: 'wordpress analytics',
					views: 8,
					previousViews: 0,
				},
				{
					id: 'term:jetpack stats',
					term: 'jetpack stats',
					views: 2,
					previousViews: 0,
				},
				{
					id: 'unknown-search-terms',
					term: 'Unknown search terms',
					views: 10,
					previousViews: 0,
				},
			],
			hasComparison: true,
		} );
	} );

	it( 'leaves previousViews undefined for a term missing from a truncated comparison', () => {
		// other_search_terms > 0 means the comparison list does not include
		// every term, so "wordpress analytics" stays a real zero while
		// "jetpack stats" is simply absent from the truncated list.
		const truncatedComparisonReport: StatsNormalizedReport< StatsSearchTermsItem > = {
			summary: { other_search_terms: 5 },
			data: [
				{
					...report.data[ 0 ],
					items: [
						{
							label: 'wordpress analytics',
							views: 0,
							className: 'user-selectable',
							children: null,
						},
					],
					encrypted_search_terms: 0,
				},
				{ ...report.data[ 1 ], items: [], encrypted_search_terms: 0 },
			],
		};

		const result = aggregateSearchTermRows(
			report,
			'Unknown search terms',
			truncatedComparisonReport
		);
		const wordpressAnalyticsRow = result.rows.find( row => row.id === 'term:wordpress analytics' );
		const jetpackStatsRow = result.rows.find( row => row.id === 'term:jetpack stats' );

		expect( wordpressAnalyticsRow?.previousViews ).toBe( 0 );
		expect( jetpackStatsRow?.previousViews ).toBeUndefined();
		expect( result.hasComparison ).toBe( true );
	} );

	it( 'treats a missing term as zero when the comparison is not truncated', () => {
		// other_search_terms absent or <= 0 means the comparison list is
		// complete, so a missing term keeps the legacy explicit-zero behavior.
		const untruncatedComparisonReport: StatsNormalizedReport< StatsSearchTermsItem > = {
			summary: { other_search_terms: -34 },
			data: [
				{
					...report.data[ 0 ],
					items: [
						{
							label: 'wordpress analytics',
							views: 0,
							className: 'user-selectable',
							children: null,
						},
					],
					encrypted_search_terms: 0,
				},
				{ ...report.data[ 1 ], items: [], encrypted_search_terms: 0 },
			],
		};

		const result = aggregateSearchTermRows(
			report,
			'Unknown search terms',
			untruncatedComparisonReport
		);
		const wordpressAnalyticsRow = result.rows.find( row => row.id === 'term:wordpress analytics' );
		const jetpackStatsRow = result.rows.find( row => row.id === 'term:jetpack stats' );

		expect( wordpressAnalyticsRow?.previousViews ).toBe( 0 );
		expect( jetpackStatsRow?.previousViews ).toBe( 0 );
		expect( result.hasComparison ).toBe( true );
	} );
} );
