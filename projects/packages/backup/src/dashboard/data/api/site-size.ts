import { apiCall, apiPath } from './_helpers';

/**
 * Response of `GET /jetpack/v4/site/backup/size`.
 *
 * WordPress.com's own envelope, forwarded verbatim: `ok` reports whether
 * WordPress.com itself could answer, so a 200 with `ok: false` carries no
 * usable figures. Like the other legacy routes, a non-200 upstream
 * collapses to a `null` body served with HTTP 200.
 *
 * The fields below are the ones legacy reads (`src/js/actions/index.js`).
 * `storage_limit_bytes` is deliberately **not** among them: this response
 * does not carry a storage limit, despite the route's name. Confirmed
 * against a live 200, whose keys are `ok`, `error`, `size`,
 * `days_of_backups_saved`, `days_of_backups_allowed`,
 * `min_days_of_backups_allowed`, `last_backup_size`, `last_backup_failed`,
 * `retention_days` and `backups_stopped`. The limit comes from
 * `/site/backup/policies` — see `policies.ts`.
 */
export type RawSiteSize = {
	ok?: boolean;
	backups_stopped?: boolean;
	size?: number;
	last_backup_size?: number;
	// Retention actually in force for this site's backups. Falls back to
	// the plan's `activity_log_limit_days` from `/policies` when zero,
	// which is how legacy spells it (`backup-storage-space/index.jsx:33`).
	retention_days?: number;
	// The three day-counts `getUsageLevel` needs to tell "over limit" from
	// "over limit and already dropping backups to cope".
	min_days_of_backups_allowed?: number;
	days_of_backups_allowed?: number;
	days_of_backups_saved?: number;
} | null;

/**
 * Fetch the site's backup storage usage.
 *
 * @return WordPress.com's payload, or `null` when it could not be read.
 */
export async function fetchSiteSize(): Promise< RawSiteSize > {
	return apiCall< RawSiteSize >( { path: apiPath( '/site/backup/size' ) } );
}
