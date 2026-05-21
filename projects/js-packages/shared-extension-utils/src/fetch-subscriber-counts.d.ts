export type SubscriberCountsApiResponse = {
	counts: {
		total_subscribers: number;
		social_followers: number;
		email_subscribers: number;
		paid_subscribers: number;
	};
	errors?: Record< string, string[] >;
};

export type SubscriberCounts = {
	totalSubscribers: number | null;
	socialFollowers: number | null;
	emailSubscribers: number | null;
	paidSubscribers: number | null;
};

export function fetchSubscriberCounts(): Promise< SubscriberCountsApiResponse >;

export function mapSubscriberCountsFromResponse(
	response: SubscriberCountsApiResponse
): SubscriberCounts;
