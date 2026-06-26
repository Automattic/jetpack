import { sanitizeStatsFollowersResponse } from '..';
import { followersFixture } from '../__fixtures__/followers';

describe( 'Stats followers normalizer', () => {
	it( 'normalizes followers subscriber rows', () => {
		const result = sanitizeStatsFollowersResponse( followersFixture );

		expect( result.summary ).toEqual( {
			page: 1,
			pages: 1,
			total: 125,
			total_email: 5,
			total_wpcom: 120,
			is_owner_subscribed: false,
		} );
		expect( result.data ).toHaveLength( 1 );
		expect( result.data[ 0 ].items[ 0 ] ).toEqual( {
			id: 111,
			label: 'reader@example.com',
			value: {
				type: 'relative-date',
				value: '2026-06-16T18:53:05+00:00',
			},
			iconClassName: 'avatar-user',
			icon: 'https://secure.gravatar.com/avatar/example?d=mm',
			link: null,
			date_subscribed: '2026-06-16T18:53:05+00:00',
			subscription_id: 111,
			actions: [ { type: 'follow', data: false } ],
			children: null,
		} );
		expect( result.data[ 0 ].items[ 1 ] ).toEqual(
			expect.objectContaining( {
				id: 333,
				label: 'Jane Reader',
				icon: null,
				link: 'https://example.com',
				subscription_id: 333,
				actions: [
					{
						type: 'follow',
						data: {
							site_id: 123,
							is_following: false,
						},
					},
				],
			} )
		);
	} );

	it( 'returns an empty report for missing subscribers', () => {
		expect(
			sanitizeStatsFollowersResponse( {
				page: 1,
				pages: 1,
				total: 0,
				total_email: 0,
				total_wpcom: 0,
				is_owner_subscribed: false,
			} )
		).toEqual( {
			summary: {
				page: 1,
				pages: 1,
				total: 0,
				total_email: 0,
				total_wpcom: 0,
				is_owner_subscribed: false,
			},
			data: [],
		} );
	} );
} );
