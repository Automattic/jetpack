/**
 * Internal dependencies
 */
import type { Announcement } from '../../types';

/**
 * Keeps the announcements a host shows, newest first.
 *
 * @param records  - Every announcement the user may see.
 * @param contexts - The contexts the host shows.
 * @return The announcements that name one of the contexts.
 */
export function getAnnouncementsForContexts(
	records: Announcement[],
	contexts: string[]
): Announcement[] {
	return records
		.filter( announcement => announcement.contexts.some( context => contexts.includes( context ) ) )
		.sort( ( a, b ) => b.date.localeCompare( a.date ) );
}

/**
 * Picks the announcement to tease: the newest one, while the user has not seen it.
 *
 * Older unseen announcements are never teased, so a new user gets one teaser and not a backlog.
 *
 * @param announcements - The announcements of the host, newest first.
 * @param markedIds     - Ids marked as seen in this page load, whatever their write answered.
 * @return The announcement to tease, or null.
 */
export function selectTeaser(
	announcements: Announcement[],
	markedIds: ReadonlySet< string >
): Announcement | null {
	const [ newest ] = announcements;

	return newest && ! newest.seen && ! markedIds.has( newest.id ) ? newest : null;
}
