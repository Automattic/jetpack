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

	it( 'orders subscribers by subscription date, newest first', () => {
		// `type=all` returns the newest email subscribers followed by the newest
		// WPCOM ones, so an older email row can precede a newer WPCOM one.
		const result = sanitizeStatsFollowersResponse( {
			...followersFixture,
			subscribers: [
				{ ID: 1, label: 'older@example.com', date_subscribed: '2025-01-26T00:00:00+00:00' },
				{ ID: 2, label: 'Newest Reader', date_subscribed: '2026-08-25T00:00:00+00:00' },
				{ ID: 3, label: 'Undated Reader' },
				{ ID: 4, label: 'Middle Reader', date_subscribed: '2026-04-28T00:00:00+00:00' },
			],
		} );

		expect( result.data[ 0 ].items.map( item => item.label ) ).toEqual( [
			'Newest Reader',
			'Middle Reader',
			'older@example.com',
			'Undated Reader',
		] );
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
