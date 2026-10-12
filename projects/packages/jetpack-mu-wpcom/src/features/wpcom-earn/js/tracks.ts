import { wpcomTrackEvent } from '../../../common/tracks.js';

/**
 * Tells these events apart from Calypso's Earn page, which records the same names.
 */
const TRACKS_PATH = '/wp-admin/admin.php?page=jetpack-earn';

/**
 * Record a Tracks event under Calypso's name, marked with this page's path.
 *
 * @param eventName  - Event name, matching Calypso's.
 * @param properties - Event properties.
 */
export function recordTracksEvent( eventName: string, properties: Record< string, unknown > = {} ) {
	wpcomTrackEvent( eventName, { ...properties, path: TRACKS_PATH } );
}
