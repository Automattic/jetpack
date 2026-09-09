export type Commenter = {
	author: string;
	email: string;
	url: string;
};

export type CurrentUser = {
	avatarUrl: string;
	commentingAs: string;
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
	providers: Provider[];
	connect: Partial< Record< Provider, ConnectUrl > >;
	origin: string;
	codeField: string;
	passportField: string;
	displayCookie: string;
	cookiePath: string;
	cookieDomain: string;
	refreshUrl: string;
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
	loggedInVia: string;
	cancel: string;
	settings: string;
	close: string;
	providers: Record< Provider | 'mail', string >;
	signInFailed: string;
	signInRateLimited: string;
};

export type Settings = {
	isLoggedIn: boolean;
	requireNameEmail: boolean;
	showCookiesConsent: boolean;
	mustLogIn: boolean;
	maxLength: number;
	strings: Strings;
	commenter: Commenter;
	user: CurrentUser | null;
	identity: IdentitySettings;
};

declare global {
	const JetpackComments: Settings;
}
