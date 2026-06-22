import { sanitizeStatsClicksResponse } from '..';
import { clicksFixture, clicksSummaryFixture } from '../__fixtures__/clicks';

describe( 'Stats clicks normalizer', () => {
	it( 'normalizes summarized clicks into range data', () => {
		const result = sanitizeStatsClicksResponse( clicksSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			total_clicks: 1323,
			other_clicks: 0,
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				items: [
					expect.objectContaining( {
						label: 'wordpress.org',
						views: 413,
						link: null,
						icon: 'https://example.com/blavatar.png',
						children: [
							expect.objectContaining( {
								label: '/plugins/jetpack-search',
								views: 100,
								link: 'https://wordpress.org/plugins/jetpack-search',
							} ),
							expect.objectContaining( {
								label: '/plugins/jetpack-boost/',
								views: 32,
								link: 'https://wordpress.org/plugins/jetpack-boost/',
							} ),
						],
					} ),
				],
			} )
		);
	} );

	it( 'normalizes clicks into by-date data points', () => {
		const result = sanitizeStatsClicksResponse( clicksFixture, {
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( {} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					expect.objectContaining( {
						label: 'wordpress.org',
						views: 12,
						children: [
							expect.objectContaining( {
								label: '/plugins/jetpack-search',
								views: 8,
							} ),
						],
					} ),
				],
			} )
		);
	} );
} );
