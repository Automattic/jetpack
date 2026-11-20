import { apiCall, apiPath } from './_helpers';

/** The retention periods the dashboard offers, matching `Retention_Bridge::RETENTION_DAYS`. */
export const RETENTION_OPTIONS = [ 7, 30, 120, 365 ] as const;

export type RetentionDays = ( typeof RETENTION_OPTIONS )[ number ];

/**
 * Narrow a number to one of the offered periods.
 *
 * @param days - Any day count.
 * @return Whether it is one of `RETENTION_OPTIONS`.
 */
export function isRetentionOption( days: number | null ): days is RetentionDays {
	return RETENTION_OPTIONS.includes( days as RetentionDays );
}

/**
 * Change how many days of backups WordPress.com keeps.
 *
 * @param days - One of the offered periods.
 * @return The bridge's confirmation.
 */
export async function updateBackupRetention(
	days: RetentionDays
): Promise< { ok: true; retention_days: number } > {
	return apiCall( {
		path: apiPath( '/site/backup/retention' ),
		method: 'POST',
		data: { retention_days: days },
	} );
}
