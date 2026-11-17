/**
 * Internal dependencies
 */
import type { Announcement, SeenDates } from '../../types';

/**
 * Keeps the announcements a host shows, newest first.
 *
 * @param records  - Every announcement the user may see.
 * @param channels - The channels the host subscribes to.
 * @return The announcements published to one of the channels.
 */
export function getAnnouncementsForChannels(
	records: Announcement[],
	channels: string[]
): Announcement[] {
	return records
		.filter( announcement => announcement.channels.some( channel => channels.includes( channel ) ) )
		.sort( ( a, b ) => b.date.localeCompare( a.date ) );
}

/**
 * Picks the announcement to tease: the newest one, while the user has not seen it.
 *
 * Older unseen announcements are never teased, so a new user gets one teaser and not a backlog.
 *
 * @param announcements - The announcements of the host, newest first.
 * @param seen          - When the user saw each announcement, by id.
 * @return The announcement to tease, or null.
 */
export function selectTeaser(
	announcements: Announcement[],
	seen: SeenDates
): Announcement | null {
	const [ newest ] = announcements;

	return newest && seen[ newest.id ] === undefined ? newest : null;
}
