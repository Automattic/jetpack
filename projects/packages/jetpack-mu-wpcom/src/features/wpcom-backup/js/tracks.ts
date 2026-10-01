import { useEffect, useRef } from 'react';
import { wpcomTrackEvent } from '../../../common/tracks.js';

/**
 * The upsell and feature ID the dashboard's Backups page reports, so wp-admin and
 * Calypso read as one funnel.
 */
export const TRACKS_FEATURE_ID = 'site-backups';

/**
 * Tells these events apart from the dashboard's, as Calypso's other surfaces do (pgz0xU-qp).
 */
const TRACKS_PATH = '/wp-admin/admin.php?page=jetpack-backup';

/**
 * Record a Tracks event under the dashboard's name, marked with this page's path.
 *
 * @param eventName  - Event name, matching the dashboard's.
 * @param properties - Event properties.
 */
export function recordTracksEvent( eventName: string, properties: Record< string, unknown > = {} ) {
	wpcomTrackEvent( eventName, { ...properties, path: TRACKS_PATH } );
}

/**
 * Record that the reader is on their way to the transfer flow.
 */
export function recordActivationConfirm() {
	recordTracksEvent( 'calypso_dashboard_hosting_feature_activation_confirm', {
		feature_id: TRACKS_FEATURE_ID,
	} );
}

/**
 * Record an impression once, when first rendered. Ports the dashboard's `ComponentViewTracker`.
 *
 * @param props            - Component props.
 * @param props.eventName  - Event name.
 * @param props.properties - Event properties.
 * @return Nothing; renders no markup.
 */
export function ViewTracker( {
	eventName,
	properties,
}: {
	eventName: string;
	properties?: Record< string, unknown >;
} ) {
	const hasTracked = useRef( false );

	useEffect( () => {
		if ( hasTracked.current ) {
			return;
		}
		hasTracked.current = true;
		recordTracksEvent( eventName, properties );
	}, [ eventName, properties ] );

	return null;
}
