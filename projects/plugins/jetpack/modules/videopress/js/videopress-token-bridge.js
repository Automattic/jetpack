( function () {
	window.addEventListener( 'message', function ( event ) {
		var allowed_origins = [ 'https://videopress.com', 'https://video.wordpress.com' ];
		if ( -1 === allowed_origins.indexOf( event.origin ) ) {
			return;
		}

		if ( event.data.event !== 'videopress_token_request' ) {
			return;
		}

		if ( ! window.videopressAjax ) {
			return;
		}

		var fetchData = {
			action: 'videopress-get-playback-jwt',
			guid: event.data.guid,
		};

		fetch( window.videopressAjax.ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: new URLSearchParams( fetchData ),
		} )
			.then( function ( response ) {
				if ( response.ok ) {
					return response.json();
				}
				throw Error( 'Response is not ok' );
			} )
			.then( function ( jsonResponse ) {
				if ( !! jsonResponse.success && jsonResponse.data ) {
					event.source.postMessage(
						{
							event: 'videopress_token_received',
							guid: fetchData.guid,
							jwt: jsonResponse.data.jwt,
						},
						'*'
					);
				} else {
					event.source.postMessage(
						{
							event: 'videopress_token_error',
							guid: fetchData.guid,
						},
						'*'
					);
				}
			} );
	} );
} )();
