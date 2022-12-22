type RecordSuccess = {
	success: boolean;
};

export async function recordBoostEvent(
	eventName: string,
	eventProp: TracksEventProperties
): Promise< RecordSuccess > {
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

	return new Promise( ( resolve, reject ) => {
		if (
			typeof jpTracksAJAX !== 'undefined' &&
			typeof jpTracksAJAX.record_ajax_event === 'function'
		) {
			jpTracksAJAX
				.record_ajax_event( `boost_${ eventName }`, 'click', eventProp )
				.done( data => {
					const successData = { success: 'success' in data && data.success === true };
					resolve( successData );
				} )
				.fail( xhr => {
					// eslint-disable-next-line no-console
					console.log(
						`Recording event 'boost_${ eventName }' failed with error: ${ xhr.responseText }`
					);
					reject( xhr.responseText );
				} );
		} else {
			reject( 'Invalid jpTracksAJAX object.' );
		}
	} );
}
