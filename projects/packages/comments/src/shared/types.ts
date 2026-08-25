export type Commenter = {
	author: string;
	email: string;
	url: string;
};

export type CurrentUser = {
	avatarUrl: string;
	commentingAs: string;
	isPassport: boolean;
};

export type CheckpointProvider = {
	id: string;
	label: string;
};

export type CheckpointSettings =
	| { enabled: false }
	| {
			enabled: true;
			blogId: number;
			connectUrl: string;
			landingUrl: string;
			providers: CheckpointProvider[];
			redeemUrl: string;
			logoutUrl: string;
			nonce: string;
			channel: string;
			disclosure: string;
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
	commentingAs: string;
	loginError: string;
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
	checkpoint: CheckpointSettings;
};

declare global {
	const JetpackComments: Settings;
}
