import { combineStatsNormalizedReports, sanitizeStatsTopPostsResponse } from '..';
import { topPostsFixture, topPostsSummaryFixture } from '../__fixtures__/top-posts';
import {
	getStatsLabel,
	getStatsSummaryIntervalFields,
	mergeStatsComparisonRows,
	normalizeStatsSummary,
} from '../utils';

describe( 'Stats report utilities', () => {
	it( 'combines separately requested summary and by-date data', () => {
		const summaryReport = sanitizeStatsTopPostsResponse( topPostsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );
		const dataReport = sanitizeStatsTopPostsResponse( topPostsFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( combineStatsNormalizedReports( summaryReport, dataReport ) ).toEqual( {
			summary: summaryReport.summary,
			data: dataReport.data,
		} );
	} );

	it( 'preserves non-numeric summary scalars', () => {
		expect(
			normalizeStatsSummary( {
				total_views: '123',
				status: 'complete',
				empty_label: '',
				enabled: true,
				date_start: '2026-06-16T00:00:00+00:00',
			} )
		).toEqual( {
			total_views: 123,
			status: 'complete',
			empty_label: '',
			enabled: true,
			date_start: '2026-06-16T00:00:00+00:00',
		} );
	} );

	it( 'derives summary start date from response buckets when query start date is absent', () => {
		expect(
			getStatsSummaryIntervalFields(
				{
					period: 'day',
					end_date: '2026-06-22',
					summarize: true,
				},
				{
					date: '2026-06-22',
					days: {
						'2026-06-16': {},
						'2026-06-22': {},
					},
				}
			)
		).toEqual( {
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
	} );

	it( 'decodes labels and falls back to malformed strings', () => {
		expect( getStatsLabel( 'News%20%26%20Updates' ) ).toBe( 'News & Updates' );
		expect( getStatsLabel( 'broken%label' ) ).toBe( 'broken%label' );
		expect( getStatsLabel( 42 ) ).toBe( '42' );
		expect( getStatsLabel( { label: 'Example' } ) ).toBe( '' );
	} );

	it( 'merges comparison rows by key without fabricating missing values', () => {
		const result = mergeStatsComparisonRows( {
			primaryRows: [
				{ key: 'us', value: 4 },
				{ key: 'jp', value: 1 },
			],
			comparisonRows: [ { key: 'us', value: 4 } ],
			getPrimaryKey: row => row.key,
			getComparisonKey: row => row.key,
			getComparisonValue: row => row.value,
			mapRow: ( row, { previousValue } ) => ( {
				...row,
				previousValue,
			} ),
		} );

		expect( result.hasComparison ).toBe( true );
		expect( result.rows ).toEqual( [
			{ key: 'us', value: 4, previousValue: 4 },
			{ key: 'jp', value: 1, previousValue: undefined },
		] );
	} );

	it( 'treats zero as a real comparison row value', () => {
		const result = mergeStatsComparisonRows( {
			primaryRows: [ { key: 'newsletter', value: 3 } ],
			comparisonRows: [ { key: 'newsletter', value: 0 } ],
			getPrimaryKey: row => row.key,
			getComparisonKey: row => row.key,
			getComparisonValue: row => row.value,
			mapRow: ( row, { previousValue } ) => ( {
				...row,
				previousValue,
			} ),
		} );

		expect( result.hasComparison ).toBe( true );
		expect( result.rows[ 0 ].previousValue ).toBe( 0 );
	} );
} );
