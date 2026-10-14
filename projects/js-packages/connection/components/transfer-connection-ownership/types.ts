/** A connected administrator the connection could be handed to. */
export interface ConnectionOwnerCandidate {
	/** Local user ID. */
	id: number;
	/** Local user login. */
	login: string;
	/** Local display name. */
	displayName: string;
	/** Local email address. */
	email: string;
}
