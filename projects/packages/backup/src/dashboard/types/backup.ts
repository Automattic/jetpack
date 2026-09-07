/**
 * Statuses seen on `GET /jetpack/v4/backups`.
 *
 * The list is descriptive, not exhaustive — WPCOM adds statuses without
 * notice, and `my-jetpack` already matches a whole *family* of them with
 * `preg_match( '/-will-retry$/', … )` rather than an equality test. The
 * union is therefore widened with `string` so unknown values type-check,
 * and every consumer must keep a fallback branch.
 */
export type KnownBackupStatus =
	| 'started'
	| 'finished'
	| 'error-will-retry'
	| 'not-accessible'
	| 'no-credentials'
	| 'no-credentials-atomic'
	| 'credential-error'
	| 'http-only-error'
	| 'backups-deactivated'
	| 'error';

export type BackupStatus = KnownBackupStatus | ( string & {} );

/**
 * A single backup attempt, normalized from the wire shape.
 *
 * WPCOM serializes VaultPress's MySQL rows straight to JSON, so numeric
 * and boolean columns arrive as strings (`percent: "10"`, `discarded:
 * "0"`, `is_backup: "1"`). Everything here is already coerced — see
 * `data/normalize/backups.ts`.
 */
export type Backup = {
	/**
	 * WPCOM's internal VaultPress attempt id. Deliberately not used to
	 * address a backup: no other endpoint resolves it, and restore /
	 * download key off the rewind id instead.
	 */
	id: string;
	status: BackupStatus;
	/** 0–100, not 0–1. */
	percent: number;
	/** False for the scan-only rows this endpoint also returns. */
	isBackup: boolean;
	/** True once WPCOM has aged the backup out of the retention window. */
	isDiscarded: boolean;
	/** Whether the entry carries a populated `stats` object. */
	hasStats: boolean;
};

/**
 * What the dashboard knows about the site's backups right now.
 *
 * `loading` — the first request is still in flight.
 *
 * `error` — the request failed, or WPCOM answered with something we
 * can't read. Distinct from `no-backups`: "we couldn't ask" must never be
 * rendered as "you have none".
 *
 * `no-backups` — the site has no backup records at all. Every new
 * customer starts here.
 *
 * `in-progress` — a backup is running now.
 *
 * `will-retry` — the only attempts so far failed, and WPCOM will try
 * again on its own.
 *
 * `no-good-backups` — attempts exist but none produced a usable restore
 * point, and nothing is running. This is the state that needs a support
 * link.
 *
 * `complete` — at least one usable restore point exists.
 */
export type BackupsState =
	| 'loading'
	| 'error'
	| 'no-backups'
	| 'in-progress'
	| 'will-retry'
	| 'no-good-backups'
	| 'complete';
