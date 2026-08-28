/**
 * How full a site's backup storage is, as five named levels.
 *
 * Ported unchanged in behaviour from
 * `src/js/components/backup-storage-space/storage-usage-levels.ts`, which
 * the legacy dashboard still uses. Keep the two in step: the flag-off
 * dashboard renders the legacy copy, and a divergence would show the same
 * site two different levels depending on a filter.
 *
 * Only the parameter types were widened, from `number` to
 * `number | null | undefined`. That is what the callers have always
 * passed — every legacy selector ends in `?? null` — and it is what makes
 * the function's own `=== null` guards mean something. No branch changed.
 *
 * This module is pure: six scalars in, a level name or `null` out. No
 * store, no globals, no i18n.
 */
export type StorageUsageLevelName = 'Full' | 'Critical' | 'Warning' | 'Normal' | 'BackupsDiscarded';

export const StorageUsageLevels: Record< StorageUsageLevelName, StorageUsageLevelName > = {
	Full: 'Full',
	Critical: 'Critical',
	Warning: 'Warning',
	Normal: 'Normal',
	BackupsDiscarded: 'BackupsDiscarded',
} as const;

const THRESHOLDS: Record< number, StorageUsageLevelName > = {
	100: StorageUsageLevels.Full,
	80: StorageUsageLevels.Critical,
	65: StorageUsageLevels.Warning,
	0: StorageUsageLevels.Normal,
};
const THRESHOLD_VALUES = Object.keys( THRESHOLDS )
	.map( Number )
	// Sorting from highest to lowest is important for getUsageLevel,
	// because it looks at the elements *in order*.
	.sort( ( a, b ) => b - a );

/**
 * Derive the storage usage level from usage, limit and retention counts.
 *
 * Presentation only — the meter's colour, the section heading and the
 * upsell copy. Whether WordPress.com has actually stopped backing the
 * site up is a separate, server-owned flag (`backups_stopped`), read by
 * `use-site-size.ts`. The two can legitimately disagree.
 *
 * @param used                    - Bytes of backup storage in use, from `/site/backup/size`.
 * @param available               - The plan's storage limit in bytes, from `/site/backup/policies`.
 * @param minDaysOfBackupsAllowed - Fewest days of backups the plan will ever keep.
 * @param daysOfBackupsAllowed    - Days of backups the current storage allows.
 * @param retentionDays           - Days of backups the plan promises.
 * @param daysOfBackupsSaved      - Days of backups actually held right now.
 * @return The level, or `null` when usage or limit is unknown.
 */
export const getUsageLevel = (
	used: number | null | undefined,
	available: number | null | undefined,
	minDaysOfBackupsAllowed: number | null | undefined,
	daysOfBackupsAllowed: number | null | undefined,
	retentionDays: number | null | undefined,
	daysOfBackupsSaved: number | null | undefined
): StorageUsageLevelName | null => {
	if ( available === undefined || used === undefined ) {
		return null;
	}

	if ( available === null || used === null ) {
		return null;
	}

	if (
		!! minDaysOfBackupsAllowed &&
		!! daysOfBackupsAllowed &&
		!! retentionDays &&
		!! daysOfBackupsSaved
	) {
		// if current days of backups saved is less than or equal to the minimum and storage is overlimit.
		if (
			minDaysOfBackupsAllowed >= daysOfBackupsSaved &&
			used > 0 &&
			available > 0 &&
			used >= available
		) {
			return StorageUsageLevels.Full;
		}

		// if current allowed days of backups is less than plan's retention days, that means
		// we discarded some backups to make other fit in current storage limit.
		if ( daysOfBackupsAllowed < retentionDays ) {
			return StorageUsageLevels.BackupsDiscarded;
		}
	}

	// Guard against divide-by-zero
	if ( available === 0 ) {
		return StorageUsageLevels.Normal;
	}

	const percentUsed = ( 100 * used ) / available;
	const thresholdValue = THRESHOLD_VALUES.find( value => percentUsed >= value ) ?? 0;
	return THRESHOLDS[ thresholdValue ];
};
