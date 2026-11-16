/** A Safe Mode resolution, named after its REST endpoint under `jetpack/v4/identity-crisis/`. */
export type IdentityCrisisAction = 'migrate' | 'start-fresh' | 'confirm-safe-mode';

/** Why a Safe Mode request failed; `getIdentityCrisisErrorCause()` says what each covers. */
export type IdentityCrisisErrorCause = 'offline' | 'blocked' | 'session' | 'permission' | 'server';

export interface IdentityCrisisError {
	action: IdentityCrisisAction;
	cause: IdentityCrisisErrorCause;
}

export interface UseIdentityCrisisActionsOptions {
	/** Admin path, relative to `wp-admin/`, to return to after a fresh connection. */
	redirectUri?: string;
}

export interface IdentityCrisisActions {
	/** Moves the connection to this site's address. Resolves true on success. */
	migrate: () => Promise< boolean >;
	/** Starts a fresh connection. Resolves with the URL to send the user to, or null on failure. */
	startFresh: () => Promise< string | null >;
	/** Keeps the site in Safe Mode. Resolves true on success. */
	confirmSafeMode: () => Promise< boolean >;
	/** The action in progress. `start-fresh` stays set after success, because the host leaves the page. */
	busyAction: IdentityCrisisAction | null;
	error: IdentityCrisisError | null;
	/** Whether `migrate` has succeeded. */
	isMigrated: boolean;
}
