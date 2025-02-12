export interface UserInfo {
	access_token?: string;
	account?: string;
	avatar?: string;
	email?: string;
	link?: string;
	name?: string;
	service: string;
	avatar_classes?: string;
	logout_url?: string;
	uid?: number;
	url?: string;
	author?: string;
}

export interface SubscriptionDetails {
	email: {
		send_posts: boolean;
		send_comments: boolean;
		post_delivery_frequency: string;
	};
	notification?: {
		send_posts: boolean;
	};
}

export type EmailPostsChange =
	| {
			type: 'subscribe';
			value: boolean;
			trackSource: 'verbum-subscription-modal' | 'verbum-toggle';
	  }
	| {
			type: 'frequency';
			value: 'daily' | 'weekly' | 'instantly';
			trackSource: 'verbum-subscription-modal' | 'verbum-toggle';
	  };

export type VerbumAppProps = {
	parentForm: HTMLFormElement;
	siteId?: number;
};
export interface VerbumComments {
	loginPostMessage?: UserInfo;
	siteId?: number;
	postId?: number;
	isAuthRequired?: boolean;
	connectURL?: string;
	logoutURL?: string;
	homeURL?: string;
	subscribeToComment?: boolean;
	subscribeToBlog?: boolean;
	mustLogIn?: boolean;
	commentRegistration?: boolean;
	requireNameEmail?: boolean;
	jetpackAvatar?: string;
	jetpackUsername?: string;
	jetpackSignature?: string;
	jetpackUserId?: number;
	isJetpackCommentsLoggedIn?: boolean;
	enableBlocks?: boolean;
	enableSubscriptionModal?: boolean;
	isJetpackComments?: boolean;
	allowedBlocks: string[];
	currentLocale: string;
	embedNonce: string;
	verbumBundleUrl: string;
	isRTL: boolean;

	/**
	 * Contains the time we started loading Highlander.
	 */
	fullyLoadedTime: number;
	vbeCacheBuster: string;
}

export type EmailSubscriptionResponse = {
	success: boolean;
	subscribed: boolean;
	subscription: {
		blog_ID: string;
		delivery_frequency: string;
		status: string;
		ts: string;
	} | null;
};

export interface SimpleSubscribeModalProps {
	closeModalHandler: () => void;
	email: string;
	subscribeState?: string;
	setSubscribeState?: ( boolean ) => void;
	setHasIframe?: ( boolean ) => void;
}

export type MailLoginData = {
	service: string;
	email?: string;
	name?: string;
	author?: string;
	url?: string;
};
