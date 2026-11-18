/**
 * Internal dependencies
 */
import { getClassicStatsUrl } from './classic-stats-url';

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
	const url = getClassicStatsUrl();

	if ( url ) {
		location.assign( url );
	}
}
