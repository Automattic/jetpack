/**
 * Internal dependencies
 */
import { sanitizeStatsEdgeBotRequestsResponse } from '../edge-bot-requests';

describe( 'sanitizeStatsEdgeBotRequestsResponse', () => {
	it( 'fills the days without requests and totals each source', () => {
		const report = sanitizeStatsEdgeBotRequestsResponse(
			[
				{
					ts: '2026-11-01 00:00:00',
					human_requests: '10',
					ai_requests: '2',
					other_requests: '1',
					blocked_requests: '4',
				},
				// ClickHouse quotes 64-bit integers unless told otherwise.
				{
					ts: '2026-11-03 00:00:00',
					human_requests: 5,
					ai_requests: 0,
					other_requests: 3,
					blocked_requests: 0,
				},
			],
			{ start: '2026-11-01', end: '2026-11-04', granularity: 'day' }
		);

		expect( report.summary ).toEqual( { human: 15, ai: 2, other: 4, blocked: 4 } );
		expect( report.data ).toEqual( [
			{
				date_start: '2026-11-01T00:00:00',
				date_end: '2026-11-01T23:59:59',
				human: 10,
				ai: 2,
				other: 1,
				blocked: 4,
			},
			{
				date_start: '2026-11-02T00:00:00',
				date_end: '2026-11-02T23:59:59',
				human: 0,
				ai: 0,
				other: 0,
				blocked: 0,
			},
			{
				date_start: '2026-11-03T00:00:00',
				date_end: '2026-11-03T23:59:59',
				human: 5,
				ai: 0,
				other: 3,
				blocked: 0,
			},
		] );
	} );

	it( 'buckets by hour when the request asked for hours', () => {
		const report = sanitizeStatsEdgeBotRequestsResponse(
			[ { ts: '2026-11-01 13:00:00', human_requests: 7 } ],
			{ start: '2026-11-01', end: '2026-11-02', granularity: 'hour' }
		);

		expect( report.data ).toHaveLength( 24 );
		expect( report.data[ 13 ] ).toEqual( {
			date_start: '2026-11-01T13:00:00',
			date_end: '2026-11-01T13:59:59',
			human: 7,
			ai: 0,
			other: 0,
			blocked: 0,
		} );
	} );

	it( 'reads a response that is not a list as no requests', () => {
		const report = sanitizeStatsEdgeBotRequestsResponse(
			{ error: 'ua_query_error' },
			{ start: '2026-11-01', end: '2026-11-02', granularity: 'day' }
		);

		expect( report.summary ).toEqual( { human: 0, ai: 0, other: 0, blocked: 0 } );
		expect( report.data ).toHaveLength( 1 );
	} );
} );
