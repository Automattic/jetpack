/**
 * Internal dependencies
 */

export function recordBoostEvent(
	eventName: string,
	eventType: string,
	eventProp: TracksEventProperties
): void {
	jpTracksAJAX.record_ajax_event( `boost_${ eventName }`, 'click', eventProp );
}
