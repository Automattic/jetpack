import { sanitizeStatsVideoPlaysResponse } from '..';
import { videoPlaysFixture, videoPlaysSummaryFixture } from '../__fixtures__/video-plays';

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
				actions: [ { type: 'link', data: 'https://example.com/video/' } ],
			} )
		);
	} );

	it( 'normalizes summarized video plays into range data', () => {
		const result = sanitizeStatsVideoPlaysResponse( videoPlaysSummaryFixture, {
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

	it( 'does not add link actions when video rows have no URL', () => {
		const result = sanitizeStatsVideoPlaysResponse(
			{
				date: '2026-06-22',
				period: 'day',
				days: {
					'2026-06-22': {
						plays: [
							{
								post_id: 12,
								title: 'Launch video',
								plays: 11,
							},
						],
					},
				},
			},
			{
				period: 'day',
				end_date: '2026-06-22',
			}
		);

		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'Launch video',
				link: null,
				actions: [],
			} )
		);
	} );
} );
