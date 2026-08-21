export type Commenter = {
	author: string;
	email: string;
	url: string;
};

export type CurrentUser = {
	displayName: string;
	avatarUrl: string;
	logoutUrl: string;
};

export type Strings = {
	submit: string;
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
	loginUrl: string;
	maxLength: number;
	submitId: string;
	submitName: string;
	strings: Strings;
	commenter: Commenter;
	user: CurrentUser | null;
};

declare global {
	// Inlined by Comment_Form::enqueue_assets() ahead of the bundle.
	const JetpackComments: Settings;
}
