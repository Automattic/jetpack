import { sanitizeStatsFollowersResponse } from '..';
import { followersFixture } from '../__fixtures__/followers';

describe( 'Stats followers normalizer', () => {
	it( 'normalizes followers subscriber rows', () => {
		const result = sanitizeStatsFollowersResponse( followersFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total: 125,
				total_email: 5,
				total_wpcom: 120,
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 111,
				label: 'reader@example.com',
				value: 0,
				date_subscribed: '2026-06-16T18:53:05+00:00',
			} )
		);
	} );
} );
