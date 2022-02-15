( function ( $ ) {
		window.addEventListener( 'message', function( event ) {
			if (event.data.event === 'videopress_token_request' ) {
				var data = {
					action: 'videopress-get-playback-jwt',
					guid: event.data.guid,
				};
				$.post( videopressAjax.ajaxUrl, data, function ( response ) {
					console.log( 'Got this from the server: ', response );
					if ( !! response.success && response.data ) {
						event.source.postMessage(
							{ event: 'videopress_token_received', guid: data.guid, jwt: response.data.jwt },
							'*'
						);
					}
				} );
			}
		} );
} )( jQuery );
