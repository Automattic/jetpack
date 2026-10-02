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
				date_start: '2026-06-24T00:00:00',
				date_end: '2026-06-25T23:59:59',
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

	it( 'keeps a null count as null rather than parsing it to zero', () => {
		const result = sanitizeStatsSubscribersResponse( {
			unit: 'month',
			fields: [ 'period', 'subscribers', 'subscribers_paid' ],
			data: [
				[ '2026-04', 0, 0 ],
				[ '2026-03', null, null ],
			],
		} );

		expect( result.data ).toEqual( [
			expect.objectContaining( { subscribers: null, subscribers_paid: null } ),
			expect.objectContaining( { subscribers: 0, subscribers_paid: 0 } ),
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
