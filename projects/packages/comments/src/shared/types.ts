import type { LocaleData } from '@wordpress/i18n';

export type Details = {
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

/**
 * Who is commenting. A popup sign-in's `code` is set until the comment posts and
 * the passport takes over; a guest's details are in `details`.
 */
export type Commenter =
	| { kind: 'user'; name: string }
	| ( Passport & { kind: 'wordpress'; code: string | null } )
	| { kind: 'guest' }
	| { kind: 'unknown' };

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
	blockTools: string;
	addBlock: string;
	reply: string;
	commentLabel: string;
	replyLabel: string;
	placeholder: string;
	replyPlaceholder: string;
	name: string;
	email: string;
	emailHint: string;
	emailHasAccount: string;
	website: string;
	intro: string;
	continueAsGuest: string;
	postWithoutSaving: string;
	save: string;
	saveDetails: string;
	close: string;
	options: string;
	manageSubscriptions: string;
	mustLogIn: string;
	logIn: string;
	logInWithWordPress: string;
	logOut: string;
	addYourName: string;
	cancel: string;
	signInFailed: string;
	tooLong: string;
	signInRateLimited: string;
};

export type Settings = {
	/** The package version that rendered the page, checked against the bundle's before it takes over. */
	version: string;
	styleUrl: string;
	isLoggedIn: boolean;
	requireNameEmail: boolean;
	mustLogIn: boolean;
	maxLength: number;
	/** Whether the block editor replaces the textarea. */
	blocks: boolean;
	/** Core's translations of the editor strings a commenter meets; empty in English. */
	editorLocale: LocaleData;
	/** Empty when the site shows no avatars. */
	avatarUrl: string;
	site: { name: string; iconUrl: string };
	/** URLs are empty where the host offers no subscriptions. */
	manageSubscriptions: { url: string; byEmail: boolean; signedInUrl: string };
	strings: Strings;
	commenter: Details;
	user: { name: string } | null;
	identity: IdentitySettings;
};

declare global {
	const JetpackComments: Settings;
	const JETPACK_COMMENTS_VERSION: string;

	interface Window {
		/** Core's translations for the editor, handed over before the chunk loads. */
		jetpackCommentsEditorLocale?: LocaleData;
		/** The editor's accessible names on the edit-comment screen, translated in PHP. */
		jetpackCommentsEditorLabels?: { blockTools: string; addBlock: string };
	}
}
