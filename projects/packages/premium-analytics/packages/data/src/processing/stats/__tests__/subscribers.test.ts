import { sanitizeStatsSubscribersCountsResponse, sanitizeStatsSubscribersResponse } from '..';
import {
	emptySubscribersCountsFixture,
	subscribersCountsFixture,
	subscribersFixture,
} from '../__fixtures__/subscribers';

describe( 'Stats subscribers normalizers', () => {
	it( 'normalizes raw subscribers matrix rows into time-series data points', () => {
		const result = sanitizeStatsSubscribersResponse( subscribersFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				subscribers: 22,
				subscribers_paid: 5,
				date_start: '2026-06-24T00:00:00+00:00',
				date_end: '2026-06-25T23:59:59+00:00',
			} )
		);
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-24',
				value: 10,
				subscribers: 10,
				subscribers_paid: 2,
				items: [],
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-25',
				value: 12,
				subscribers: 12,
				subscribers_paid: 3,
				items: [],
			} ),
		] );
	} );

	it( 'normalizes subscribers counts by flattening the raw counts object', () => {
		expect( sanitizeStatsSubscribersCountsResponse( subscribersCountsFixture ) ).toEqual( {
			total_subscribers: 42,
			email_subscribers: 31,
			paid_subscribers: 5,
			social_followers: 9,
		} );
	} );

	it( 'preserves missing counts as unset fields', () => {
		expect( sanitizeStatsSubscribersCountsResponse( emptySubscribersCountsFixture ) ).toEqual( {
			total_subscribers: undefined,
			email_subscribers: undefined,
			paid_subscribers: undefined,
			social_followers: undefined,
		} );
	} );
} );
