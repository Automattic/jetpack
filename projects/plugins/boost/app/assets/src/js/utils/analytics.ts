// eslint-disable-next-line wpcalypso/import-docblock
/// <reference types ="@types/jquery"/>

export function recordBoostEvent(
	eventName: string,
	eventType: string,
	eventProp: TracksEventProperties
): JQueryXHR {
	// eslint-disable-next-line camelcase
	if ( ! ( 'boost_version' in eventProp ) && 'version' in Jetpack_Boost ) {
		// eslint-disable-next-line camelcase
		eventProp.boost_version = Jetpack_Boost.version;
	}

	if (
		typeof jpTracksAJAX !== 'undefined' &&
		typeof jpTracksAJAX.record_ajax_event === 'function'
	) {
		return jpTracksAJAX.record_ajax_event( `boost_${ eventName }`, 'click', eventProp );
	}
}
