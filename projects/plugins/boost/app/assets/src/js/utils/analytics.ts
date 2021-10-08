/**
 * Internal dependencies
 */

export function recordBoostEvent(
	eventName: string,
	eventType: string,
	eventProp: TracksEventProperties
): void {
	if ( ! ( 'boost_version' in eventProp ) ) {
		eventProp.boost_version = Jetpack_Boost.version;
	}

	jpTracksAJAX.record_ajax_event( `boost_${ eventName }`, 'click', eventProp );
}
