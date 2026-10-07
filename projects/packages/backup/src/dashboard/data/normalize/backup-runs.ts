import type { BackupActivityItem } from '../../types/activity';
import type { RawBackupSize } from '../api/backup-sizes';

export type BackupRun = {
	/** The whole site's size when the backup ran, in bytes — not the storage it added. */
	siteSize: number | null;
	/** Seconds from start to finish. */
	duration: number;
};

/**
 * Find a backup row's size and duration among the bridge's records.
 *
 * Records are keyed by start time and rows by finish time, so a row's record is the
 * latest start at or before its finish. That only holds while the record is present:
 * a row that is not rewindable, or one newer than `seenUpTo`, would match the backup before it.
 *
 * @param item     - The backup row.
 * @param records  - Records from every loaded page.
 * @param seenUpTo - The newest finish on screen when the records were requested; older backups are in them.
 * @return The row's run, or null when no record can be trusted to be its own.
 */
export function matchBackupRun(
	item: Pick< BackupActivityItem, 'rewindId' | 'isRewindable' >,
	records: RawBackupSize[],
	seenUpTo: number
): BackupRun | null {
	const finish = Number( item.rewindId );
	if ( ! item.isRewindable || ! Number.isFinite( finish ) || finish > seenUpTo ) {
		return null;
	}

	let match: RawBackupSize | null = null;
	for ( const record of records ) {
		if ( record.period <= finish && ( ! match || record.period > match.period ) ) {
			match = record;
		}
	}
	if ( ! match ) {
		return null;
	}

	return {
		siteSize: match.size > 0 ? match.size : null,
		duration: Math.round( finish - match.period ),
	};
}
