export function recordBoostEvent(
	eventName: string,
	eventType: string,
	eventProp: TracksEventProperties
): void {
	// eslint-disable-next-line camelcase
	if ( ! ( 'boost_version' in eventProp ) && 'version' in Jetpack_Boost ) {
		eventProp.boost_version = Jetpack_Boost.version;
	}

	jpTracksAJAX.record_ajax_event( `boost_${ eventName }`, 'click', eventProp );
}
