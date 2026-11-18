import type { IdentityCrisisContext } from '../../helpers/connection-tracking.ts';

/** A Safe Mode resolution, named after its REST endpoint under `jetpack/v4/identity-crisis/`. */
export type IdentityCrisisAction = 'migrate' | 'start-fresh' | 'confirm-safe-mode';

/** Why a Safe Mode request failed; `getIdentityCrisisErrorCause()` says what each covers. */
export type IdentityCrisisErrorCause =
	'offline' | 'blocked' | 'output' | 'session' | 'permission' | 'server';

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
	/** The screen's `context` prop, passed to `trackIdentityCrisisEvent()`. Without it, `context` is sent as null. */
	context?: IdentityCrisisContext;
	/** `isDevelopmentSite` from the Safe Mode state, sent with the events. */
	isDevelopmentSite?: boolean;
}

/** How the user reached an action. Its events send `path`. */
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
}
