import { combineStatsNormalizedReports, sanitizeStatsTopPostsResponse } from '..';
import { topPostsFixture, topPostsSummaryFixture } from '../__fixtures__/top-posts';
import { getStatsBuckets, getStatsSummaryIntervalFields, normalizeStatsSummary } from '../utils';

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

	it( 'resolves single raw buckets by period start date', () => {
		expect(
			getStatsBuckets(
				{
					date: '2026-06-22',
					period: 'week',
					days: {
						'2026-06-09': { total_views: 12 },
						'2026-06-16': { total_views: 24 },
					},
				},
				{
					period: 'week',
					end_date: '2026-06-22',
				}
			)
		).toEqual( [ [ '2026-06-16', { total_views: 24 } ] ] );
	} );
} );
