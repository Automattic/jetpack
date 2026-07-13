import { aggregateVideoRows, getVideoRowId, videosToTimeSeries } from './aggregate';
import type { StatsNormalizedReport, StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';

const liveBucketedResponse = {
	date: '2026-07-10',
	period: 'day',
	days: {
		'2026-07-08': {
			data: [
				{
					post_id: 441,
					title: 'demo-video-mp4',
					views: 34,
					impressions: 40,
					watch_time: 0.02,
					retention_rate: 67.1,
				},
				{
					post_id: 461,
					title: 'feature-walkthrough-mp4',
					views: 23,
					impressions: 30,
					watch_time: 0.01,
					retention_rate: 61.5,
				},
				{
					post_id: 454,
					title: 'product-tour-mp4',
					views: 22,
					impressions: 30,
					watch_time: 0.01,
					retention_rate: 70.1,
				},
				{
					post_id: 456,
					title: 'webinar-recording-mp4',
					views: 10,
					impressions: 10,
					watch_time: 0.005,
					retention_rate: 75.4,
				},
			],
		},
		'2026-07-09': {
			data: [
				{ post_id: 441, title: 'demo-video-mp4', views: 33, impressions: 30 },
				{ post_id: 461, title: 'feature-walkthrough-mp4', views: 23, impressions: 25 },
				{ post_id: 454, title: 'product-tour-mp4', views: 22, impressions: 28 },
				{ post_id: 456, title: 'webinar-recording-mp4', views: 9, impressions: 15 },
			],
		},
		'2026-07-10': {
			data: [
				{ post_id: 441, title: 'demo-video-mp4', views: 6, impressions: 40 },
				{ post_id: 461, title: 'feature-walkthrough-mp4', views: 6, impressions: 28 },
				{ post_id: 454, title: 'product-tour-mp4', views: 5, impressions: 30 },
				{ post_id: 456, title: 'webinar-recording-mp4', views: 4, impressions: 21 },
			],
		},
	},
};

/**
 * Build the normalized report the buckets hook would produce from the live
 * fixture response, so aggregation tests run on realistic data.
 *
 * @return The normalized bucketed report.
 */
function normalizeFixtureBuckets(): StatsNormalizedReport< StatsVideoPlaysItem > {
	return {
		summary: {
			date_start: '2026-07-08T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
		},
		data: Object.entries( liveBucketedResponse.days ).map( ( [ date, bucket ] ) => ( {
			time_interval: date,
			date_start: `${ date }T00:00:00+00:00`,
			date_end: `${ date }T23:59:59+00:00`,
			items: bucket.data.map( item => ( {
				id: item.post_id,
				label: item.title,
				plays: item.views,
				impressions: item.impressions,
				watch_time: item.watch_time ?? 0,
				retention_rate: item.retention_rate ?? 0,
				link: null,
				children: null,
			} ) ),
		} ) ),
	};
}

/**
 * Build a video row fixture.
 *
 * @param overrides - Fields to override on the default row.
 * @return The video row.
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

const report: StatsNormalizedReport< StatsVideoPlaysItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-06-01',
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-01T23:59:59+00:00',
			items: [
				makeVideo( { plays: 10, impressions: 30 } ),
				makeVideo( {
					id: 2,
					label: 'Demo',
					link: 'https://example.com/demo/',
					plays: 5,
					impressions: 12,
				} ),
			],
		},
		{
			time_interval: '2026-06-02',
			date_start: '2026-06-02T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
			items: [ makeVideo( { plays: 7, impressions: 20 } ) ],
		},
	],
};

describe( 'report videos aggregate', () => {
	it( 'builds plays totals for each chart bucket', () => {
		const series = videosToTimeSeries( report );

		expect( series.summary ).toEqual( {
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
		} );
		expect( series.data.map( point => point.plays ) ).toEqual( [ 15, 7 ] );
	} );

	it( 'groups real daily totals into calendar weeks for the chart', () => {
		const series = videosToTimeSeries( report, 'week' );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-02T23:59:59+00:00',
				plays: 22,
			} ),
		] );
	} );

	it( 'aggregates plays and impressions without mutating the report', () => {
		const rows = aggregateVideoRows( report );

		expect( rows ).toEqual( [
			expect.objectContaining( { id: 1, plays: 17, impressions: 50 } ),
			expect.objectContaining( { id: 2, plays: 5, impressions: 12 } ),
		] );
		expect( report.data[ 0 ].items[ 0 ].plays ).toBe( 10 );
	} );

	it( 'aggregates every live date bucket into full-range table totals', () => {
		const normalized = normalizeFixtureBuckets();

		expect( aggregateVideoRows( normalized ) ).toEqual( [
			expect.objectContaining( {
				id: 441,
				label: 'demo-video-mp4',
				plays: 73,
				impressions: 110,
			} ),
			expect.objectContaining( {
				id: 461,
				label: 'feature-walkthrough-mp4',
				plays: 52,
				impressions: 83,
			} ),
			expect.objectContaining( { id: 454, plays: 49, impressions: 88 } ),
			expect.objectContaining( { id: 456, plays: 23, impressions: 46 } ),
		] );
	} );

	it( 'builds one correctly dated chart point from every live date bucket', () => {
		const normalized = normalizeFixtureBuckets();
		const series = videosToTimeSeries( normalized );

		expect(
			series.data.map( point => ( {
				date: point.time_interval,
				dateStart: point.date_start,
				plays: point.plays,
			} ) )
		).toEqual( [
			{ date: '2026-07-08', dateStart: '2026-07-08T00:00:00+00:00', plays: 89 },
			{ date: '2026-07-09', dateStart: '2026-07-09T00:00:00+00:00', plays: 87 },
			{ date: '2026-07-10', dateStart: '2026-07-10T00:00:00+00:00', plays: 21 },
		] );
	} );

	it( 'falls back from id to URL and then title for row identity', () => {
		expect( getVideoRowId( makeVideo( { id: undefined } ) ) ).toBe( 'https://example.com/video/' );
		expect( getVideoRowId( makeVideo( { id: undefined, link: null } ) ) ).toBe( 'Launch video' );
	} );
} );
