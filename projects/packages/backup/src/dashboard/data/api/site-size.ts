import { apiCall, apiPath } from './_helpers';

/**
 * Response of `GET /jetpack/v4/site/backup/size`.
 *
 * WPCOM's own envelope, forwarded verbatim: `ok` reports whether WPCOM
 * itself could answer, so a 200 with `ok: false` carries no usable
 * figures. Like the other legacy routes, a non-200 upstream collapses to
 * a `null` body served with HTTP 200.
 */
export type RawSiteSize = {
	ok?: boolean;
	backups_stopped?: boolean;
	size?: number;
	last_backup_size?: number;
	storage_limit_bytes?: number;
} | null;

/**
 * Fetch the site's backup storage usage.
 *
 * @return WPCOM's payload, or `null` when it could not be read.
 */
export async function fetchSiteSize(): Promise< RawSiteSize > {
	return apiCall< RawSiteSize >( { path: apiPath( '/site/backup/size' ) } );
}
