import type { StatsFollowersRawResponse } from '../followers';

export const followersFixture = {
	page: 1,
	pages: 1,
	total: 125,
	total_email: 5,
	total_wpcom: 120,
	is_owner_subscribed: false,
	subscribers: [
		{
			ID: 111,
			label: 'reader@example.com',
			avatar: 'https://secure.gravatar.com/avatar/example?s=96',
			url: null,
			follow_data: null,
			date_subscribed: '2026-06-16T18:53:05+00:00',
		},
		{
			ID: 222,
			display_name: 'Jane Reader',
			avatar: null,
			url: 'https://example.com',
			follow_data: {
				params: {
					site_id: 123,
					is_following: false,
				},
			},
			date_subscribed: '2026-06-15T10:30:00+00:00',
			email_subscription_id: 333,
			subscription_id: 222,
		},
	],
} satisfies StatsFollowersRawResponse;
