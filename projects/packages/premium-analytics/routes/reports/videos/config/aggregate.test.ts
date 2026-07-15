import { getVideoRowId, videosToTimeSeries } from './aggregate';
import type {
	StatsNormalizedReport,
	StatsVideoPlaysItem,
	StatsVideoPlaysSummaryItem,
} from '@jetpack-premium-analytics/data';

/**
 * Build a normalized daily video-play item for chart tests.
 *
 * @param overrides - Fields to override on the default item.
 * @return The normalized video-play item.
 */
function makeVideo( overrides: Partial< StatsVideoPlaysItem > = {} ): StatsVideoPlaysItem {
	return {
		id: 1,
		label: 'Launch video',
		plays: 0,
		impressions: 0,
		watch_time: 0,
		retention_rate: 0,
		link: 'https://example.com/video/',
		children: null,
		...overrides,
	};
}

/**
 * Build a complete-stats summary row for table identity tests.
 *
 * @param overrides - Fields to override on the default row.
 * @return The summary row.
 */
function makeSummaryVideo(
	overrides: Partial< StatsVideoPlaysSummaryItem > = {}
): StatsVideoPlaysSummaryItem {
	return {
		id: 1,
		title: 'Launch video',
		views: 17,
		impressions: 50,
		watch_time: 0.02,
		retention_rate: 67.1,
		link: 'https://example.com/video/',
		...overrides,
	};
}

const report: StatsNormalizedReport< StatsVideoPlaysItem > = {
	summary: {
		date_start: '2026-06-04T00:00:00+00:00',
		date_end: '2026-06-05T23:59:59+00:00',
	},
	data: [
		{
			time_interval: '2026-06-04',
			date_start: '2026-06-04T00:00:00+00:00',
			date_end: '2026-06-04T23:59:59+00:00',
			items: [ makeVideo( { plays: 10 } ), makeVideo( { id: 2, plays: 5 } ) ],
		},
		{
			time_interval: '2026-06-05',
			date_start: '2026-06-05T00:00:00+00:00',
			date_end: '2026-06-05T23:59:59+00:00',
			items: [ makeVideo( { plays: 7 } ) ],
		},
	],
};

describe( 'report videos aggregate', () => {
	it( 'builds plays totals for each daily chart bucket', () => {
		const series = videosToTimeSeries( report );

		expect( series.summary ).toEqual( {
			date_start: '2026-06-04T00:00:00+00:00',
			date_end: '2026-06-05T23:59:59+00:00',
		} );
		expect( series.data.map( point => point.plays ) ).toEqual( [ 15, 7 ] );
	} );

	it( 'groups daily plays into calendar weeks for the chart', () => {
		const series = videosToTimeSeries( report, 'week' );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-05T23:59:59+00:00',
				plays: 22,
			} ),
		] );
	} );

	it( 'falls back from summary id to URL and then title for row identity', () => {
		expect( getVideoRowId( makeSummaryVideo( { id: undefined } ) ) ).toBe(
			'https://example.com/video/'
		);
		expect( getVideoRowId( makeSummaryVideo( { id: undefined, link: null } ) ) ).toBe(
			'Launch video'
		);
	} );
} );
