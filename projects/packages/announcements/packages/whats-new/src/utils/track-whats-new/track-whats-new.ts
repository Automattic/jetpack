/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { onSurfaceEvent } from '../surface-events';
import type { SurfaceEvent } from '../surface-events';
import type * as Contract from '@automattic/jetpack-announcements';

const TRACKS_EVENTS: Record< SurfaceEvent[ 'type' ], string > = {
	teaserView: 'jetpack_announcements_teaser_view',
	teaserOpen: 'jetpack_announcements_teaser_open',
	teaserDismiss: 'jetpack_announcements_teaser_dismiss',
	readerLinkClick: 'jetpack_announcements_reader_link_click',
	teaserSwitch: 'jetpack_announcements_teaser_switch',
};

let isTracking = false;

/**
 * Tells Tracks who the user is, and pins the site onto every event.
 */
function identify(): void {
	const scriptData = getScriptData();
	const wpcomUser = scriptData?.user?.current_user?.wpcom;

	if ( wpcomUser?.ID && wpcomUser?.login ) {
		jetpackAnalytics.setUser( wpcomUser.ID, wpcomUser.login );
		jetpackAnalytics.identifyUser();
	}

	const blogId = scriptData?.site?.wpcom?.blog_id;

	if ( blogId ) {
		jetpackAnalytics.assignSuperProps( { blog_id: blogId } );
	}
}

/**
 * The properties Tracks records with an event of the surface.
 *
 * @param {SurfaceEvent} event - The event.
 * @return The properties.
 */
function toProperties( event: SurfaceEvent ): Record< string, string | boolean > {
	return event.type === 'teaserSwitch'
		? { enabled: event.isOn }
		: { announcement_id: event.announcementId };
}

/**
 * Records the events of the surface in Tracks, from this call on.
 *
 * The surface works the same without it. A page has one surface, so a second call does nothing.
 */
export const trackWhatsNew: typeof Contract.trackWhatsNew = () => {
	if ( isTracking ) {
		return;
	}

	isTracking = true;
	identify();

	onSurfaceEvent( event => {
		jetpackAnalytics.tracks.recordEvent( TRACKS_EVENTS[ event.type ], toProperties( event ) );
	} );
};
