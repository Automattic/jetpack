import { useCallback, useEffect, useRef } from 'react';
import { wpcomTrackEvent } from '../../../common/tracks.js';
import { useFeature } from './feature-context.ts';

/**
 * Event recorders for this page, under the dashboard's event names so wp-admin and
 * Calypso read as one funnel, and marked with this page's path to tell them apart,
 * as Calypso's other surfaces do (pgz0xU-qp).
 *
 * @return The recorders.
 */
export function useTracks() {
	const { tracksFeatureId, tracksPath } = useFeature();

	const recordTracksEvent = useCallback(
		( eventName: string, properties: Record< string, unknown > = {} ) => {
			wpcomTrackEvent( eventName, { ...properties, path: tracksPath } );
		},
		[ tracksPath ]
	);

	// The reader is on their way to the transfer flow.
	const recordActivationConfirm = useCallback( () => {
		recordTracksEvent( 'calypso_dashboard_hosting_feature_activation_confirm', {
			feature_id: tracksFeatureId,
		} );
	}, [ recordTracksEvent, tracksFeatureId ] );

	return { tracksFeatureId, recordTracksEvent, recordActivationConfirm };
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
	const { recordTracksEvent } = useTracks();
	const hasTracked = useRef( false );

	useEffect( () => {
		if ( hasTracked.current ) {
			return;
		}
		hasTracked.current = true;
		recordTracksEvent( eventName, properties );
	}, [ eventName, properties, recordTracksEvent ] );

	return null;
}
