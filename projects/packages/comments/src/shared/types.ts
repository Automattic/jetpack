export type Commenter = {
	author: string;
	email: string;
	url: string;
};

export type CurrentUser = {
	displayName: string;
	avatarUrl: string;
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
	commentingAs: string;
	logOut: string;
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
};

declare global {
	const JetpackComments: Settings;
}
