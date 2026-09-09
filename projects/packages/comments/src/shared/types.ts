export type CurrentUser = {
	avatarUrl: string;
	/** The attribution line, already formatted. Empty when the name is unknown. */
	commentingAs: string;
	/** Vouched by WordPress.com rather than logged in to this site. */
	isPassport: boolean;
};

/** A signed connect request, good for one attempt. */
export type SignedRequest = {
	url: string;
	challenge: string;
	/** Seconds since epoch. */
	expires: number;
	/** The page origin it was signed for. */
	origin: string;
};

export type CheckpointSettings =
	| { enabled: false }
	| {
			enabled: true;
			/** Minted with the page, for the first attempt. */
			connect: SignedRequest;
			/** The exact origin a result is accepted from. */
			connectOrigin: string;
			signUrl: string;
			nonce: string;
			/** The hidden field a held code rides to the server in. */
			codeField: string;
	  };

export type FormSettings = {
	postId: number;
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
	logOut: string;
	postingAs: string;
	notYou: string;
	loginError: string;
};

export type Settings = {
	isLoggedIn: boolean;
	maxLength: number;
	strings: Strings;
	user: CurrentUser | null;
	checkpoint: CheckpointSettings;
};

declare global {
	const JetpackComments: Settings;
}
