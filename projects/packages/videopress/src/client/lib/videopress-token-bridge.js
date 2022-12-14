( function () {
	window.addEventListener( 'message', function ( event ) {
		const allowed_origins = [ 'https://videopress.com', 'https://video.wordpress.com' ];
		if ( -1 === allowed_origins.indexOf( event.origin ) ) {
			return;
		}

		if ( event.data.event !== 'videopress_token_request' ) {
			return;
		}

		if ( ! window.videopressAjax ) {
			return;
		}

		// acknowledge receipt of message so player knows if it can expect a response or if it should try again later.
		// Important for situations where the iframe loads prior to the bridge being ready.
		event.source.postMessage(
			{
				event: 'videopress_token_request_ack',
				guid: event.data.guid,
				requestId: event.data.requestId,
			},
			'*'
		);

		const fetchData = {
			action: 'videopress-get-playback-jwt',
			guid: event.data.guid,
			post_id: window.videopressAjax.post_id || 0,
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
							requestId: event.data.requestId,
						},
						'*'
					);
				} else {
					event.source.postMessage(
						{
							event: 'videopress_token_error',
							guid: fetchData.guid,
							requestId: event.data.requestId,
						},
						'*'
					);
				}
			} );
	} );
} )();
