import analytics from '@automattic/jetpack-analytics';

export type TracksEventProperties = { [ key: string ]: string | number };

/**
 * Send an event to Tracks.
 *
 * @param {string}                eventName Event name, minus the jetpack_boost_ prefix.
 * @param {TracksEventProperties} eventProp Object containing the event properties. Please note that keys must be in snake_case.
 */
export async function recordBoostEvent(
	eventName: string,
	eventProp: TracksEventProperties
): Promise< void > {
	eventProp = addBoostProps( eventProp );

	return new Promise( resolve => {
		if (
			typeof jpTracksAJAX !== 'undefined' &&
			typeof jpTracksAJAX.record_ajax_event === 'function'
		) {
			jpTracksAJAX
				.record_ajax_event( `boost_${ eventName }`, 'click', eventProp )
				.done( resolve )
				.fail( xhr => {
					// eslint-disable-next-line no-console
					console.log(
						`Recording event 'boost_${ eventName }' failed with error: ${ xhr.responseText }`
					);
					resolve();
				} );
		} else {
			// eslint-disable-next-line no-console
			console.log( 'Invalid jpTracksAJAX object.' );
			resolve();
		}
	} );
}

/**
 * Send an event via a Tracking Pixel.
 *
 * @param {string}                eventName Event name, minus the jetpack_boost_ prefix.
 * @param {TracksEventProperties} eventProp Object containing the event properties. Please note that keys must be in snake_case.
 */
export async function recordBoostPixelEvent( eventName: string, eventProp: TracksEventProperties ) {
	eventProp = addBoostProps( eventProp );

	analytics.tracks.recordEvent( `jetpack_boost_${ eventName }`, eventProp );
}

function addBoostProps( props: TracksEventProperties ): TracksEventProperties {
	const defaultProps: { [ key: string ]: string } = {};

	/**
	 * The config might not always be available, i.e. image-guide in the front-end.
	 *
	 * So we need to check if it exists before using it in case this function is called from the front end.
	 */
	if ( typeof Jetpack_Boost === 'object' ) {
		defaultProps.boost_version = Jetpack_Boost.version;
	}

	return { ...defaultProps, ...props };
}

export async function recordBoostEventAndRedirect(
	url: string,
	eventName: string,
	eventProp: TracksEventProperties = {}
) {
	await recordBoostEvent( eventName, eventProp );
	window.location.href = url;
}
