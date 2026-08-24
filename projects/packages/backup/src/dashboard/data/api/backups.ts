import { apiCall, apiPath } from './_helpers';

/**
 * One entry of `GET /jetpack/v4/backups`, exactly as it arrives.
 *
 * `Jetpack_Backup::get_recent_backups()` hands WPCOM's body through
 * untouched, and WPCOM serializes VaultPress's MySQL rows directly — so
 * integer and boolean columns come back as strings. The hand-authored
 * fixtures in the legacy tree use real numbers for the same fields, so
 * both spellings are live and every numeric field is typed as the union.
 * Coerce through `data/normalize/backups.ts` rather than reading these
 * fields directly.
 */
export type RawBackupEntry = {
	id: string | number;
	started: string;
	last_updated: string;
	status: string;
	period: string | number;
	percent: string | number;
	is_backup: string | number;
	is_scan: string | number;
	has_snapshot?: boolean;
	has_warnings?: boolean;
	/** `'0'` | `'1'` — a string, and only present on finished entries. */
	discarded?: string;
	/** Only present on finished entries, and can legitimately be `{}`. */
	stats?: Record< string, unknown >;
};

/**
 * Fetch the site's ten most recent backup attempts.
 *
 * **`null` is a reachable, non-exceptional response.**
 * `Jetpack_Backup::get_recent_backups()` returns bare `null` on any
 * non-200 from WPCOM, which WordPress serves as HTTP 200 with a `null`
 * body — so `apiFetch` resolves rather than rejecting and no `ApiError`
 * is ever constructed. Callers must treat `null` as a failure to read
 * the state, never as "this site has no backups": conflating the two
 * renders a WPCOM outage as the brand-new-customer screen.
 *
 * @return The backup list, or `null` when WPCOM could not be read.
 */
export async function fetchBackups(): Promise< RawBackupEntry[] | null > {
	return apiCall< RawBackupEntry[] | null >( { path: apiPath( '/backups' ) } );
}

/**
 * Response of `POST /jetpack/v4/site/backup/enqueue`.
 *
 * Two different failures are encoded in the body rather than the status
 * code: `null` for any non-200 WPCOM reply (same mechanism as
 * `fetchBackups`), and `{ success: false, error }` for a 200 that WPCOM
 * nonetheless refused. Only the second carries a reason.
 */
export type EnqueueBackupResponse = {
	success?: boolean;
	error?: string;
} | null;

/**
 * Ask WPCOM to run a backup now.
 *
 * @return WPCOM's reply, or `null` when it could not be read.
 */
export async function enqueueBackup(): Promise< EnqueueBackupResponse > {
	return apiCall< EnqueueBackupResponse >( {
		path: apiPath( '/site/backup/enqueue' ),
		method: 'POST',
	} );
}
