import { apiCall, apiPath } from './_helpers';

/** A backup's start time, in epoch seconds, and the site's size when it ran, in bytes (`0` = unmeasured). */
export type RawBackupSize = {
	period: number;
	size: number;
};

export type BackupSizesPage = {
	totalPages: number;
	/** Newest first. */
	backups: RawBackupSize[];
};

/**
 * Fetch one page of backup sizes from the bridge.
 *
 * An unreadable answer becomes an empty last page: sizes are extra, and must never take the list down.
 *
 * @param page - 1-indexed page number.
 * @return The page.
 */
export async function fetchBackupSizes( page: number ): Promise< BackupSizesPage > {
	const raw = await apiCall< Partial< BackupSizesPage > | null >( {
		path: apiPath( '/backups/sizes', { page } ),
	} );
	return Array.isArray( raw?.backups )
		? { totalPages: Number( raw.totalPages ) || 0, backups: raw.backups }
		: { totalPages: 0, backups: [] };
}
