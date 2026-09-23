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

export type CheckpointResult =
	{ code: string; name: string; avatar: string } | { error: string } | { cancelled: true };
