/**
 * Subscriber and API response types — mirrors the WP.com `/wpcom/v2/sites/{id}/subscribers`
 * payload (with `use_new_helper=true`) so we can render the DataViews table directly from
 * the proxy response.
 */

export type SubscriptionStatus =
	| 'Subscribed'
	| 'Not sending'
	| 'Not subscribed'
	| 'Not confirmed'
	| 'Unconfirmed'
	| 'Blocked'
	| string;

export type SubscriptionPlan = {
	subscription_id?: number;
	is_comp: boolean;
	comp_id?: number;
	is_gift?: boolean;
	paid_subscription_id?: string;
	status?: string;
	title?: string;
	currency?: string;
	renewal_period?: string;
	renewal_price?: number;
	renew_interval?: string;
	inactive_renew_interval?: string;
	start_date?: string;
	end_date?: string | null;
};

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

	// Paid / comp subscriptions, only present when `use_new_helper=true`.
	plans?: SubscriptionPlan[];
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

export type RemoveSubscriberPayload = {
	user_id?: number;
	email_subscription_id?: number;
	paid_subscription_ids?: string[];
};

export type RemoveSubscriberError = {
	step: string;
	id: string;
	error: string;
};

export type RemoveSubscriberResponse = {
	ok: boolean;
	errors: RemoveSubscriberError[];
};

export type AddSubscribersResponse = {
	sent?: string[];
	errors?: Record< string, string >;
	[ key: string ]: unknown;
};

export type SubscriberCountry = {
	code: string;
	name: string;
};

export type SubscriberDetails = Subscriber & {
	country?: SubscriberCountry | null;
	url?: string | null;
	open_rate?: number;
};

export type SubscriberStats = {
	emails_sent: number;
	unique_opens: number;
	unique_clicks: number;
	blog_registration_date?: string;
};
