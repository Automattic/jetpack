export type Frequency = 'instantly' | 'daily' | 'weekly';

export type SubscriptionState = {
	email: {
		send_posts: boolean;
		send_comments: boolean;
		post_delivery_frequency: Frequency;
	};
	notification: {
		send_posts: boolean;
	};
};

/** What to set. Anything left out is left alone. */
export type SubscriptionChange = {
	email_posts?: boolean;
	email_comments?: boolean;
	notify_posts?: boolean;
	frequency?: Frequency;
};

export type SubscriptionSettings = {
	blog: boolean;
	comments: boolean;
	notifications: boolean;
	url: string;
	action: string;
	nonce: string;
};

export type Answer = {
	state?: SubscriptionState | null;
	ok: boolean;
	signedOut: boolean;
	/** The sign-in code went with this request and is spent, whatever else happened. */
	redeemed: boolean;
};
