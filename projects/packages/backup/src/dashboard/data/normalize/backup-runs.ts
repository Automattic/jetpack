import type { BackupActivityItem } from '../../types/activity';
import type { RawBackupSize } from '../api/backup-sizes';

/**
 * The whole site's size when the backup ran, in bytes (not the storage it added), and its
 * seconds from start to finish. At least one is known.
 */
export type BackupRun =
	{ siteSize: number; duration: number | null } | { siteSize: null; duration: number };

/**
 * Find a backup row's size and duration among the bridge's records.
 *
 * A row and its record share the backup's start time, so a row whose record is missing
 * matches nothing rather than the backup before it.
 *
 * @param item    - The backup row; its rewind id is normally when the backup finished.
 * @param records - Records from every loaded page.
 * @return The row's run, or null while its record is not loaded or when it knows neither.
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

	// Rows WordPress.com rebuilds from VaultPress carry the start as their rewind id.
	const duration = finish > record.period ? Math.round( finish - record.period ) : null;
	if ( record.size > 0 ) {
		return { siteSize: record.size, duration };
	}
	return duration === null ? null : { siteSize: null, duration };
}
