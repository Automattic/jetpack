import { aggregateSearchTermRows, searchTermsToTimeSeries } from './aggregate';
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
		expect( aggregateSearchTermRows( report, 'Unknown search terms' ) ).toEqual( [
			{ id: 'term:wordpress analytics', term: 'wordpress analytics', views: 8 },
			{ id: 'term:jetpack stats', term: 'jetpack stats', views: 2 },
			{ id: 'unknown-search-terms', term: 'Unknown search terms', views: 10 },
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

		expect( aggregateSearchTermRows( emptyReport, 'Unknown search terms' ) ).toEqual( [] );
	} );

	it( 'includes known and encrypted views in each chart bucket', () => {
		const series = searchTermsToTimeSeries( report, 'day' );

		expect( series.summary ).toEqual( {
			date_start: '2026-06-03T00:00:00+00:00',
			date_end: '2026-06-04T23:59:59+00:00',
		} );
		expect( series.data.map( point => point.views ) ).toEqual( [ 9, 11 ] );
	} );

	it( 'groups daily totals into ISO weeks starting on Monday', () => {
		const series = searchTermsToTimeSeries( report, 'week' );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-04T23:59:59+00:00',
				views: 20,
			} ),
		] );
		expect( series.summary ).toEqual( {
			date_start: '2026-06-03T00:00:00+00:00',
			date_end: '2026-06-04T23:59:59+00:00',
		} );
	} );

	it( 'groups daily totals into calendar months', () => {
		const series = searchTermsToTimeSeries( report, 'month' );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-04T23:59:59+00:00',
				views: 20,
			} ),
		] );
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
			aggregateSearchTermRows( reportWithoutEncrypted, 'Unknown search terms' )
		).toHaveLength( 2 );
	} );
} );
