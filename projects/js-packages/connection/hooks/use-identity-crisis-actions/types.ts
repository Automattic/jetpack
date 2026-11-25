/** A Safe Mode resolution, named after its REST endpoint under `jetpack/v4/identity-crisis/`. */
export type IdentityCrisisAction = 'migrate' | 'start-fresh' | 'confirm-safe-mode';

/** Why a Safe Mode request failed; `getIdentityCrisisErrorCause()` says what each covers. */
export type IdentityCrisisErrorCause =
	| 'offline'
	| 'blocked'
	| 'output'
	| 'session'
	| 'permission'
	| 'disconnected'
	| 'resolved'
	| 'server';

export interface IdentityCrisisError {
	action: IdentityCrisisAction;
	cause: IdentityCrisisErrorCause;
	/** The REST error code, or the client error's name, e.g. `rest_cookie_invalid_nonce` or `JsonParseError`. For tracking, not display. */
	code?: string;
}

export interface UseIdentityCrisisActionsOptions {
	/** Admin path, relative to `wp-admin/`, to return to after a fresh connection. */
	redirectUri?: string;
	/** Name from `CONNECTION_FROM`, reported to WordPress.com with a fresh connection. */
	from?: string;
}

/** How the user reached an action, for the `jetpack_idc_*` events (CONNECT-620); unused until then. */
export interface IdentityCrisisActionPath {
	entry: 'main' | 'guide';
	/** Picks joined by `>`, e.g. `detected_copy>safe`; see `getPath()`. */
	path: string;
}

export interface IdentityCrisisActions {
	/** Moves the connection to this site's address. Resolves true on success. */
	migrate: ( path?: IdentityCrisisActionPath ) => Promise< boolean >;
	/** Starts a fresh connection. Resolves with the URL to send the user to, or null on failure. */
	startFresh: ( path?: IdentityCrisisActionPath ) => Promise< string | null >;
	/** Keeps the site in Safe Mode. Resolves true on success. */
	confirmSafeMode: ( path?: IdentityCrisisActionPath ) => Promise< boolean >;
	/** Forgets the last failure, e.g. when the user moves to another step. */
	clearError: () => void;
	/**
	 * The action in progress. `start-fresh` and `confirm-safe-mode` stay set after success, because the host leaves or reloads the page.
	 * While it is set, the actions send no request and resolve as a failure, without setting `error`.
	 */
	busyAction: IdentityCrisisAction | null;
	error: IdentityCrisisError | null;
	/** Whether `migrate` has succeeded. */
	isMigrated: boolean;
	/** Whether a failed fresh connection has left the site disconnected. A later error doesn't clear it. */
	isDisconnected: boolean;
	/** Whether a fresh connection was refused because the site is no longer in Safe Mode, e.g. after another tab. A later error doesn't clear it. */
	isResolved: boolean;
}
