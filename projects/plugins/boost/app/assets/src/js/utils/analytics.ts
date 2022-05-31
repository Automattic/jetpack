type RecordSuccess = {
	success: boolean;
};

export async function recordBoostEvent(
	eventName: string,
	eventProp: TracksEventProperties
): Promise< RecordSuccess > {
	// eslint-disable-next-line camelcase
	if ( ! ( 'boost_version' in eventProp ) && 'version' in Jetpack_Boost ) {
		// eslint-disable-next-line camelcase
		eventProp.boost_version = Jetpack_Boost.version;
	}

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
