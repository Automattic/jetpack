import { sanitizeStatsSubscribersCountsResponse, sanitizeStatsSubscribersResponse } from '..';
import {
	emptySubscribersCountsFixture,
	subscribersCountsFixture,
} from '../__fixtures__/subscribers';

describe( 'Stats subscribers normalizers', () => {
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
