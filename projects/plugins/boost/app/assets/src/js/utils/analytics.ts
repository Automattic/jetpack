export async function recordBoostEvent(
	eventName: string,
	eventProp: TracksEventProperties
): Promise< void > {
	const defaultProps: { [ key: string ]: string } = {};
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
