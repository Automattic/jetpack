import type { IdentitySettings, Provider } from '../identity/types';
import type { SubscriptionSettings } from '../tray/subscriptions/types';

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
