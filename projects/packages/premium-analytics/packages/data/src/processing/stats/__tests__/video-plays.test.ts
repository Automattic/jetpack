import { sanitizeStatsVideoPlaysResponse } from '..';
import {
	videoPlaysCompleteStatsSummaryFixture,
	videoPlaysFixture,
	videoPlaysSummaryFixture,
} from '../__fixtures__/video-plays';

describe( 'Stats video plays normalizer', () => {
	it( 'normalizes video plays with the default plays shape', () => {
		expect(
			sanitizeStatsVideoPlaysResponse( videoPlaysFixture, {
				period: 'day',
				end_date: '2026-06-16',
			} ).data[ 0 ].items[ 0 ]
		).toEqual(
			expect.objectContaining( {
				id: 12,
				label: 'Launch video',
				plays: 11,
				link: 'https://example.com/video/',
			} )
		);
	} );

	it( 'normalizes summarized video plays into range data', () => {
		const result = sanitizeStatsVideoPlaysResponse( videoPlaysSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total_plays: 11,
				other_plays: 0,
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 12,
				label: 'Launch video',
				plays: 11,
				link: 'https://example.com/video/',
			} )
		);
	} );

	it( 'normalizes complete summarized video plays into range data', () => {
		const result = sanitizeStatsVideoPlaysResponse( videoPlaysCompleteStatsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
			complete_stats: true,
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total: {
					views: '11',
					impressions: '42',
					watch_time: '128.5',
				},
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 12,
				label: 'Launch video',
				plays: 11,
				impressions: 42,
				watch_time: 128.5,
				retention_rate: 61.25,
			} )
		);
	} );
} );
