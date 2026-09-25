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

export type IdentitySettings = {
	blogId: number;
	canSignIn: boolean;
	connect: ConnectUrl | null;
	origin: string;
	codeField: string;
	passportField: string;
	displayCookie: string;
	cookieHash: string;
	cookiePath: string;
	cookieDomain: string;
	defaultAvatar: string;
	refreshUrl: string;
	emailUrl: string;
	logoutUrl: string;
	logoutAction: string;
};

/**
 * Who the reader signed in as through the popup, or the passport that brought
 * them back. `code` is set until the comment posts and the passport takes over.
 */
export type SignedIn = Passport & {
	code: string | null;
};

/** A subscribe checkbox the host would have drawn itself, posted under the host's own field name. */
export type Subscription = {
	name: string;
	label: string;
	checked: boolean;
};

export type FormSettings = {
	postId: number;
	loginUrl: string;
	logoutUrl: string;
	submitId: string;
	submitName: string;
	submitClass: string;
	submitWrapClass: string;
	submitLabel: string;
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
	isLoggedIn: boolean;
	requireNameEmail: boolean;
	mustLogIn: boolean;
	maxLength: number;
	/** The site user's avatar, the saved guest's, or the site default. Empty when avatars are off. */
	avatarUrl: string;
	/** The theme's Avatar block wrapper classes, so the form avatar is styled like the thread's. */
	avatarWrapClass: string;
	site: { name: string; iconUrl: string };
	/** Where a reader manages their subscriptions to this site. URLs are empty where the host offers none. */
	subscriptions: { url: string; byEmail: boolean; signedInUrl: string };
	strings: Strings;
	commenter: Commenter;
	user: { name: string } | null;
	identity: IdentitySettings;
};

declare global {
	const JetpackComments: Settings;
}
