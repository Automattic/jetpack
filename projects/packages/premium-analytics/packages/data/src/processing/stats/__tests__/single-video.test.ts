import { sanitizeStatsSingleVideoResponse } from '..';
import {
	singleVideoAllMetricsFixture,
	singleVideoEmptyFixture,
	singleVideoFixture,
} from '../__fixtures__/single-video';

describe( 'Stats single video normalizer', () => {
	it( 'normalizes the views time series and embed pages', () => {
		const result = sanitizeStatsSingleVideoResponse( singleVideoFixture );

		expect( result ).toEqual( {
			data: [
				{ period: '2026-06-12', value: 1 },
				{ period: '2026-06-13', value: 4 },
				{ period: '2026-06-14', value: 0 },
			],
			metrics: null,
			total: null,
			pages: [
				{
					label: 'https://example.com/intro-video/',
					link: 'https://example.com/intro-video/',
				},
				{
					label: 'https://example.com/2026/06/launch-recap/',
					link: 'https://example.com/2026/06/launch-recap/',
				},
			],
			post: {
				id: 31533,
				title: 'Launch recap',
				date: '2026-06-12 14:30:00',
				mimeType: 'video/mp4',
				poster: 'https://i0.wp.com/videos.files.wordpress.com/abcd1234/launch-recap.jpg',
			},
		} );
	} );

	it( 'lists the statType=all metric names from fields and keeps the range totals', () => {
		expect( sanitizeStatsSingleVideoResponse( singleVideoAllMetricsFixture ) ).toEqual( {
			// The leading metric column still backs the plain views series.
			data: [
				{ period: '2026-07-01', value: 3 },
				{ period: '2026-07-02', value: 0 },
			],
			metrics: [ 'plays', 'impressions', 'watch_time', 'retention_rate' ],
			total: { plays: 3, impressions: 14, watch_time: 0.5, retention_rate: 25.5 },
			pages: [],
			post: null,
		} );
	} );

	it( 'drops non-numeric total cells instead of coercing them to zero', () => {
		// A missing or malformed cell is unknown, not a measured zero — coercing
		// it would render a fabricated statistic (e.g. "Retention rate 0.0%").
		const report = sanitizeStatsSingleVideoResponse( {
			...singleVideoAllMetricsFixture,
			total: { plays: 3, impressions: '14', watch_time: null, retention_rate: 'N/A' },
		} );

		expect( report.total ).toEqual( { plays: 3, impressions: 14 } );
	} );

	it( 'returns empty data for an empty-window object payload without range rows', () => {
		// Legacy empty windows return a single `{ date, p }` object instead of
		// the usual tuples; it must not crash the tuple or fields mapping.
		expect(
			sanitizeStatsSingleVideoResponse( {
				data: { date: '7-10', p: '0' },
				pages: [],
			} )
		).toEqual( { data: [], metrics: null, total: null, pages: [], post: null } );
	} );

	it( 'returns empty collections for an empty payload', () => {
		expect( sanitizeStatsSingleVideoResponse( singleVideoEmptyFixture ) ).toEqual( {
			data: [],
			metrics: null,
			total: null,
			pages: [],
			post: null,
		} );
	} );

	it( 'drops malformed rows and keeps only well-formed [ date, views ] tuples', () => {
		expect( sanitizeStatsSingleVideoResponse( undefined ) ).toEqual( {
			data: [],
			metrics: null,
			total: null,
			pages: [],
			post: null,
		} );
		expect(
			sanitizeStatsSingleVideoResponse( {
				data: [ 'not-a-row', [], [ 1, 2 ], [ '2026-06-12', 2 ] ],
				pages: [ 7 ],
				post: 'not-a-post',
			} )
		).toEqual( {
			data: [ { period: '2026-06-12', value: 2 } ],
			metrics: null,
			total: null,
			pages: [],
			post: null,
		} );
	} );

	it( 'keeps only well-formed attachment post fields', () => {
		expect(
			sanitizeStatsSingleVideoResponse( {
				post: {
					ID: '42',
					post_title: 'Demo',
					post_date: '2026-06-15 09:00:00',
					post_mime_type: 'video/webm',
				},
			} ).post
		).toEqual( {
			id: 42,
			title: 'Demo',
			date: '2026-06-15 09:00:00',
			mimeType: 'video/webm',
		} );

		expect(
			sanitizeStatsSingleVideoResponse( {
				post: { ID: -1, post_title: 7, post_date: false, post_mime_type: 12, poster: null },
			} ).post
		).toEqual( {} );
	} );
} );
