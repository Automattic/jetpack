import { mergeStatsVideoPlaysComparisonRows, sanitizeStatsVideoPlaysResponse } from '..';
import { videoPlaysFixture, videoPlaysSummaryFixture } from '../__fixtures__/video-plays';
import type { StatsNormalizedReport, StatsVideoPlaysItem } from '..';

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

describe( 'mergeStatsVideoPlaysComparisonRows', () => {
	const makeVideo = ( overrides: Partial< StatsVideoPlaysItem > ): StatsVideoPlaysItem => ( {
		label: '',
		plays: 0,
		impressions: 0,
		watch_time: 0,
		retention_rate: 0,
		link: null,
		children: null,
		...overrides,
	} );

	const makeReport = (
		items: StatsVideoPlaysItem[]
	): StatsNormalizedReport< StatsVideoPlaysItem > => ( {
		summary: {},
		data: [
			{
				time_interval: '2026-06-22',
				date_start: '2026-06-22 00:00:00',
				date_end: '2026-06-22 23:59:59',
				items,
			},
		],
	} );

	it( 'does not match unrelated rows that lack any stable identifier', () => {
		const { rows, hasComparison } = mergeStatsVideoPlaysComparisonRows(
			makeReport( [ makeVideo( { plays: 10 } ) ] ),
			makeReport( [ makeVideo( { plays: 4 } ) ] )
		);

		expect( rows[ 0 ].previousPlays ).toBeUndefined();
		expect( hasComparison ).toBe( false );
	} );

	it( 'matches rows by video id when present', () => {
		const { rows, hasComparison } = mergeStatsVideoPlaysComparisonRows(
			makeReport( [ makeVideo( { id: 12, label: 'Launch video', plays: 10 } ) ] ),
			makeReport( [ makeVideo( { id: 12, label: 'Launch video', plays: 4 } ) ] )
		);

		expect( rows[ 0 ].previousPlays ).toBe( 4 );
		expect( hasComparison ).toBe( true );
	} );
} );
