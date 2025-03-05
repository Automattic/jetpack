export type SessionsStatus = {
	/** The expiration time of the session. */
	expiration: number;

	/** The IP address of the session. */
	ip: string;

	/** The login of the session. */
	login: string;

	/** The token of the session. */
	token: string;

	/** The user agent of the session. */
	ua: string;

	/** The user ID of the session. */
	user_id: string;
};
