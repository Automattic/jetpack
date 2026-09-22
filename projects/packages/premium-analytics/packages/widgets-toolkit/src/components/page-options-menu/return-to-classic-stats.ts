/**
 * WordPress dependencies
 */
import { getAdminUrl } from '@automattic/jetpack-script-data';

/**
 * Leaves the dashboard for classic Stats, where the invitation back lives.
 *
 * Its own module, and the location a parameter, so the flow and the redirect can each be
 * tested: jsdom implements no navigation.
 *
 * @param location - Where to navigate; the window's, unless a test hands in a stand-in.
 */
export function returnToClassicStats(
	location: Pick< Location, 'assign' > = window.location
): void {
	location.assign( getAdminUrl( 'admin.php?page=stats' ) );
}
