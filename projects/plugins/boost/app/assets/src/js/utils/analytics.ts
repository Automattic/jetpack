// Todo: Import correct jqXHR type definition.
// import type { jqXHR } from '@types/jquery';
// eslint-disable-next-line wpcalypso/import-docblock

export function recordBoostEvent(
	eventName: string,
	eventType: string,
	eventProp: TracksEventProperties
): void {
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
