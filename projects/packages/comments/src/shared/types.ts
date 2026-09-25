export type Commenter = {
	author: string;
	email: string;
	url: string;
};

export type ConnectUrl = {
	url: string;
	expires: number;
	challenge: string;
};

export type Passport = {
	name: string;
	avatar: string;
};

/** `code` is set until the comment posts and the passport takes over. */
export type SignedIn = Passport & {
	code: string | null;
};

export type IdentitySettings = {
	blogId: number;
	canSignIn: boolean;
	connect: ConnectUrl | null;
	connectUrl: string;
	emailUrl: string;
	origin: string;
	codeField: string;
	passportField: string;
	displayCookie: string;
	cookieHash: string;
	cookiePath: string;
	cookieDomain: string;
	defaultAvatar: string;
	logoutUrl: string;
	logoutAction: string;
};

/** A subscribe checkbox the host draws itself, posted under the host's own field name. */
export type Subscription = {
	name: string;
	label: string;
	checked: boolean;
};

export type FormSettings = {
	postId: number;
	loginUrl: string;
	logoutUrl: string;
	submit: {
		id: string;
		name: string;
		class: string;
		wrapClass: string;
		label: string;
	};
	subscriptions: Subscription[];
};

export type Strings = {
	reply: string;
	commentLabel: string;
	replyLabel: string;
	placeholder: string;
	replyPlaceholder: string;
	name: string;
	email: string;
	emailHint: string;
	emailHasAccount: string;
	required: string;
	website: string;
	intro: string;
	introOr: string;
	save: string;
	saveAndPost: string;
	postWithoutSaving: string;
	close: string;
	edit: string;
	manageSubscriptions: string;
	mustLogIn: string;
	logIn: string;
	logInWithWordPress: string;
	logOut: string;
	commentingAs: string;
	cancel: string;
	signInFailed: string;
	signInRateLimited: string;
};

export type Settings = {
	/** The package version that rendered the page, checked against the bundle's before it takes over. */
	version: string;
	isLoggedIn: boolean;
	requireNameEmail: boolean;
	mustLogIn: boolean;
	maxLength: number;
	/** Empty when the site shows no avatars. */
	avatarUrl: string;
	site: { name: string; iconUrl: string };
	/** URLs are empty where the host offers no subscriptions. */
	manageSubscriptions: { url: string; byEmail: boolean; signedInUrl: string };
	strings: Strings;
	commenter: Commenter;
	user: { name: string } | null;
	identity: IdentitySettings;
};

declare global {
	const JetpackComments: Settings;
	const JETPACK_COMMENTS_VERSION: string;
}
