import analytics from '@automattic/jetpack-analytics';

export type TracksUser = { userid: number; username: string } | null | undefined;

let initialized = false;

/**
 * Record a Tracks event as the connected user, identifying them the first time.
 *
 * @param user  - The connected user's Tracks identity, from page load.
 * @param event - Event name.
 * @param props - Event properties.
 */
export default function recordEvent(
	user: TracksUser,
	event: string,
	props: Record< string, string | number > = {}
) {
	if ( ! initialized && user ) {
		analytics.initialize( user.userid, user.username );
		initialized = true;
	}
	analytics.tracks.recordEvent( event, props );
}
