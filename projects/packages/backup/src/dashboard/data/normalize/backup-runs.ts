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
 * A row and its record share the backup's start time, so a row whose record is missing
 * matches nothing rather than the backup before it.
 *
 * @param item    - The backup row; its rewind id is when the backup finished.
 * @param records - Records from every loaded page.
 * @return The row's run, or null while its record is not loaded or when it has none.
 */
export function matchBackupRun(
	item: Pick< BackupActivityItem, 'rewindId' | 'backupPeriod' >,
	records: RawBackupSize[]
): BackupRun | null {
	const finish = Number( item.rewindId );
	const record = records.find( candidate => candidate.period === item.backupPeriod );
	if ( ! record || ! Number.isFinite( finish ) ) {
		return null;
	}

	return {
		siteSize: record.size > 0 ? record.size : null,
		duration: Math.round( finish - record.period ),
	};
}
