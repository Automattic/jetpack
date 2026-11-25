/**
 * Internal dependencies
 */
import { sanitizeStatsEdgeBotRequestsResponse } from '../edge-bot-requests';

describe( 'sanitizeStatsEdgeBotRequestsResponse', () => {
	beforeEach( () => {
		jest.useFakeTimers().setSystemTime( new Date( '2026-11-10T00:00:00Z' ) );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

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

	it( "cuts the hours to the reader's window and names them in the site's time", () => {
		// Taipei's November 2: 16:00 UTC on the 1st to 15:59 UTC on the 2nd.
		const report = sanitizeStatsEdgeBotRequestsResponse(
			[
				{ ts: '2026-11-01 15:00:00', human_requests: 99 },
				{ ts: '2026-11-01 16:00:00', human_requests: 7 },
				{ ts: '2026-11-02 15:00:00', human_requests: 3 },
				{ ts: '2026-11-02 16:00:00', human_requests: 99 },
			],
			{
				start: '2026-11-01',
				end: '2026-11-03',
				granularity: 'hour',
				window_start: '2026-11-01T16:00:00.000Z',
				window_end: '2026-11-02T15:59:59.999Z',
				timezone: 'Asia/Taipei',
			}
		);

		expect( report.summary.human ).toBe( 10 );
		expect( report.data ).toHaveLength( 24 );
		expect( report.data[ 0 ] ).toMatchObject( {
			date_start: '2026-11-02T00:00:00',
			date_end: '2026-11-02T00:59:59',
			human: 7,
		} );
		expect( report.data[ 23 ] ).toMatchObject( { date_start: '2026-11-02T23:00:00', human: 3 } );
	} );

	it( 'folds the repeated hour of a fall-back day into one bucket', () => {
		// New York's November 1, 2026: 1 AM EDT (05:00Z) and 1 AM EST (06:00Z) both read 1 AM.
		const report = sanitizeStatsEdgeBotRequestsResponse(
			[
				{ ts: '2026-11-01 05:00:00', human_requests: 2 },
				{ ts: '2026-11-01 06:00:00', human_requests: 3 },
			],
			{
				start: '2026-11-01',
				end: '2026-11-03',
				granularity: 'hour',
				window_start: '2026-11-01T04:00:00.000Z',
				window_end: '2026-11-02T04:59:59.999Z',
				timezone: 'America/New_York',
			}
		);

		expect( report.summary.human ).toBe( 5 );
		expect( report.data ).toHaveLength( 24 );
		expect( report.data[ 1 ] ).toMatchObject( {
			date_start: '2026-11-01T01:00:00',
			date_end: '2026-11-01T01:59:59',
			human: 5,
		} );
		expect( report.data[ 2 ].date_start ).toBe( '2026-11-01T02:00:00' );
	} );

	it.each( [
		[ 'day', '2026-11-05', [ '2026-11-01T00:00:00', '2026-11-03T00:00:00' ] ],
		[ 'hour', '2026-11-04', [ '2026-11-03T00:00:00', '2026-11-03T17:00:00' ] ],
	] as const )( 'leaves out the %ss that have not started', ( granularity, end, expected ) => {
		jest.setSystemTime( new Date( '2026-11-03T17:19:00Z' ) );

		const report = sanitizeStatsEdgeBotRequestsResponse( [], {
			start: granularity === 'day' ? '2026-11-01' : '2026-11-03',
			end,
			granularity,
		} );
		const starts = report.data.map( point => point.date_start );

		expect( starts ).toHaveLength( granularity === 'day' ? 3 : 18 );
		expect( starts[ 0 ] ).toBe( expected[ 0 ] );
		expect( starts[ starts.length - 1 ] ).toBe( expected[ 1 ] );
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
