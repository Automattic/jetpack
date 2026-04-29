/**
 * Subscriber and API response types — mirrors the WP.com `/wpcom/v2/sites/{id}/subscribers`
 * payload so we can render the DataViews table directly from the proxy response.
 */

export type SubscriptionStatus =
	| 'Subscribed'
	| 'Not sending'
	| 'Not subscribed'
	| 'Unconfirmed'
	| 'Blocked'
	| string;

export type Subscriber = {
	user_id: number;
	display_name: string;
	email_address: string;
	avatar?: string;
	subscription_status: SubscriptionStatus;

	// WP.com-side subscription (null when subscriber is email-only).
	wpcom_subscription_id?: number;
	wpcom_date_subscribed?: string;

	// Email-side subscription (always present for email subscribers).
	email_subscription_id?: number;
	email_date_subscribed?: string;
};

export type SubscribersResponse = {
	total: number;
	pages: number;
	page: number;
	per_page: number;
	subscribers: Subscriber[];
	is_owner_subscribed?: boolean;
};

export type SubscribersSortField = 'date_subscribed' | 'name' | 'plan' | 'subscription_status';

export type SubscribersSortOrder = 'asc' | 'desc';

export type SubscribersFilter =
	| 'all'
	| 'paid'
	| 'comp'
	| 'free'
	| 'email_subscriber'
	| 'reader_subscriber'
	| 'unconfirmed_subscriber'
	| 'blocked_subscriber';

export type SubscribersQueryParams = {
	page: number;
	perPage: number;
	sort: SubscribersSortField;
	sortOrder: SubscribersSortOrder;
	search?: string;
	filters: SubscribersFilter[];
};
