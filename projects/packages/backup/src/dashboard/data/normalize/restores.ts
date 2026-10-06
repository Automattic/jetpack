import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { parseRestoreWhen } from '../api/restore';
import type { ActivityItem } from '../../types/activity';
import type { ActivitySortOrder } from '../api/activity-log';
import type { RecentRestore } from '../api/restore';

/** Namespaces the row id so it cannot collide with a WPCOM `activity_id`. */
const RESTORE_ROW_ID_PREFIX = 'restore-';

/**
 * Whether a selection id addresses a merged restore row.
 *
 * @param id - A selection id from the list or the URL.
 * @return True when the id names a restore rather than an activity entry.
 */
export function isRestoreRowId( id: string ): boolean {
	return id.startsWith( RESTORE_ROW_ID_PREFIX );
}

/**
 * What to call a restore, from the two booleans `RecentRestore` derives.
 *
 * Two booleans cannot tell a failure from an abort or a partial success, so the
 * unsuccessful case says only that it did not finish rather than blaming one.
 *
 * @param restore - The collection row.
 * @return The row's title.
 */
function restoreTitle( restore: RecentRestore ): string {
	if ( ! restore.settled ) {
		return __( 'Restore in progress', 'jetpack-backup-pkg' );
	}
	return restore.succeeded
		? __( 'Restore complete', 'jetpack-backup-pkg' )
		: __( "Restore didn't finish", 'jetpack-backup-pkg' );
}

/**
 * Which backup the restore was aiming at, as a sentence.
 *
 * A rewind id is the backup's unix timestamp, so this needs no second read.
 *
 * @param rewindId - The row's rewind id.
 * @return The summary line, or undefined when the id is not a timestamp.
 */
function restoreSummary( rewindId: string ): string | undefined {
	const seconds = Number( rewindId );
	if ( ! Number.isFinite( seconds ) || seconds <= 0 ) {
		return undefined;
	}
	return sprintf(
		/* translators: %s: date and time of the backup that was restored. */
		__( 'Restore to %s', 'jetpack-backup-pkg' ),
		dateI18n( 'M j, Y, g:i A', new Date( seconds * 1000 ).toISOString(), undefined )
	);
}

/**
 * Convert one restores-collection row into an activity row.
 *
 * Null when `when` cannot be read: the list places rows by time, and a row
 * with no time has nowhere to go.
 *
 * @param restore - The collection row.
 * @return The activity item, or null.
 */
export function normalizeRestore( restore: RecentRestore ): ActivityItem | null {
	const when = parseRestoreWhen( restore.when );
	if ( when === null ) {
		return null;
	}

	return {
		id: `${ RESTORE_ROW_ID_PREFIX }${ restore.restore_id }`,
		kind: 'restore',
		title: restoreTitle( restore ),
		publishedAt: new Date( when ).toISOString(),
		actor: { type: 'Application', name: 'Jetpack' },
		summary: restoreSummary( restore.rewind_id ),
	};
}

/**
 * Every readable row of the collection, as activity items.
 *
 * @param restores - The collection, or null when the read failed.
 * @return The restore rows.
 */
export function normalizeRestores( restores: RecentRestore[] | null | undefined ): ActivityItem[] {
	return ( restores ?? [] )
		.map( normalizeRestore )
		.filter( ( row ): row is ActivityItem => row !== null );
}

/**
 * The restore row a selection id addresses, or null.
 *
 * @param restores - The collection, or null when the read failed.
 * @param id       - A selection id known to be a restore row's.
 * @return The matching row, or null.
 */
export function findRestoreRow(
	restores: RecentRestore[] | null | undefined,
	id: string
): ActivityItem | null {
	return normalizeRestores( restores ).find( row => row.id === id ) ?? null;
}

type PageWindow = {
	/** 1-indexed page the list is showing. */
	page: number;
	/** How many pages the server says there are; anything unusable reads as one. */
	totalPages: number;
	sortOrder: ActivitySortOrder;
};

/**
 * Whether this page is the one holding the newest activity.
 *
 * @param placement - Which page the list is showing, and in which direction.
 * @return True on page 1 descending, on the last page ascending.
 */
function holdsNewestActivity( placement: PageWindow ): boolean {
	const lastPage = Math.max( 1, placement.totalPages || 1 );
	return placement.sortOrder === 'desc' ? placement.page <= 1 : placement.page >= lastPage;
}

/**
 * Fold the restores collection into one page of activity rows.
 *
 * All of them land on the page holding the newest activity, because the
 * collection has no paging of its own and any split drops rows that fall in a gap.
 *
 * @param items     - The page's activity rows.
 * @param restores  - The collection, or null when the read failed.
 * @param placement - Which page the list is showing, and in which direction.
 * @return The merged rows, with each restore spliced in by timestamp.
 */
export function mergeRestoreRows(
	items: ActivityItem[],
	restores: RecentRestore[] | null | undefined,
	placement: PageWindow
): ActivityItem[] {
	if ( ! holdsNewestActivity( placement ) ) {
		return items;
	}

	const newestFirst = placement.sortOrder === 'desc';
	const rows = normalizeRestores( restores )
		.map( row => ( { row, at: Date.parse( row.publishedAt ) } ) )
		.sort( ( a, b ) => ( newestFirst ? b.at - a.at : a.at - b.at ) );

	if ( rows.length === 0 ) {
		return items;
	}

	const merged = [ ...items ];
	for ( const { row, at } of rows ) {
		const index = merged.findIndex( item => {
			const other = Date.parse( item.publishedAt );
			if ( Number.isNaN( other ) ) {
				return false;
			}
			return newestFirst ? other < at : other > at;
		} );
		merged.splice( index === -1 ? merged.length : index, 0, row );
	}

	return merged;
}
