export type Commenter = {
	author: string;
	email: string;
	url: string;
};

export type CurrentUser = {
	avatarUrl: string;
	commentingAs: string;
	email: string;
};

export type Provider = 'wordpress' | 'google' | 'facebook';

export type ConnectUrl = {
	url: string;
	expires: number;
	challenge: string;
};

export type Passport = {
	provider: Provider;
	name: string;
	avatar: string;
};

export type IdentitySettings = {
	blogId: number;
	providers: Provider[];
	connect: Partial< Record< Provider, ConnectUrl > >;
	origin: string;
	codeField: string;
	passportField: string;
	displayCookie: string;
	cookiePath: string;
	cookieDomain: string;
	defaultAvatar: string;
	refreshUrl: string;
	logoutUrl: string;
	logoutAction: string;
};

/** `code` is held until the first subscriptions read or the comment posts; then the passport takes over. */
export type SignedIn = Passport & {
	code: string | null;
};

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

export type FormSettings = {
	postId: number;
	loginUrl: string;
	logoutUrl: string;
	submitId: string;
	submitName: string;
	submitLabel: string;
};

export type Strings = {
	reply: string;
	commentLabel: string;
	replyLabel: string;
	placeholder: string;
	replyPlaceholder: string;
	name: string;
	email: string;
	emailPlaceholder: string;
	website: string;
	websitePlaceholder: string;
	guestPrompt: string;
	mustLogInPrompt: string;
	logIn: string;
	guestPromptRequired: string;
	saveDetails: string;
	logOut: string;
	logInOrProvide: string;
	logInOrProvideReply: string;
	logInOptional: string;
	logInOptionalReply: string;
	logInToReply: string;
	loggedInVia: Record< Provider, string >;
	cancel: string;
	settings: string;
	close: string;
	providers: Record< Provider | 'mail', string >;
	signInFailed: string;
	signInRateLimited: string;
	emailNewPosts: string;
	emailNewComments: string;
	notifyNewPosts: string;
	notifyNewPostsHint: string;
	instantly: string;
	daily: string;
	weekly: string;
	editGravatar: string;
};

export type Settings = {
	isLoggedIn: boolean;
	requireNameEmail: boolean;
	showCookiesConsent: boolean;
	mustLogIn: boolean;
	maxLength: number;
	locale: string;
	strings: Strings;
	commenter: Commenter;
	user: CurrentUser | null;
	identity: IdentitySettings;
	subscriptions: SubscriptionSettings;
};

declare global {
	const JetpackComments: Settings;
}
