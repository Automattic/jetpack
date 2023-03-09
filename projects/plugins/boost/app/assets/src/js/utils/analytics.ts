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
	const defaultProps: { [ key: string ]: string } = {};

	/**
	 * Jetpack Boost constant is not available on the front end.
	 *
	 * So we need to check if it exists before using it in case this function is called from the front end.
	 */
	if ( typeof Jetpack_Boost !== 'undefined' ) {
		if ( 'version' in Jetpack_Boost ) {
			defaultProps.boost_version = Jetpack_Boost.version;
		}
		if ( 'connection' in Jetpack_Boost ) {
			defaultProps.jetpack_connection = Jetpack_Boost.connection.connected
				? 'connected'
				: 'disconnected';
		}
		if ( 'optimizations' in Jetpack_Boost ) {
			defaultProps.optimizations = JSON.stringify( Jetpack_Boost.optimizations );
		}
	}

	eventProp = { ...defaultProps, ...eventProp };

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
