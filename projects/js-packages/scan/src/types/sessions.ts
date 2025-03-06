export type SessionsStatus = {
	/** The expiration time of the session. */
	expiration: number;

	/** The IP address of the session. */
	ip: string;

	/** The login of the session. */
	login: number;

	/** The token of the session. */
	token: string;

	/** The user agent of the session. */
	ua: string;

	/** The user ID of the session. */
	userId: number;

	/** The user name of the session. */
	userLogin: string;

	/** The user roles of the session. */
	userRoles: string[];

	/** The last action of the session. */
	lastAction: string;

	/** Whether the session is suspicious. */
	isSuspicious: boolean;
};
