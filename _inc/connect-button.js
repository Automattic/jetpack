/* global jpConnect */

jQuery( document ).ready( function( $ ) {
	$( '.jp-connect-button' ).click( function( event ) {
		event.preventDefault();
		if ( ! jetpackConnectButton.isRegistering ) {
			jetpackConnectButton.handleClick();
		}
	} );

	var jetpackConnectButton = {
		isRegistering: false,
		handleClick: function() {
			jetpackConnectButton.isRegistering = true;
			$( '.jp-connect-button' ).text( jpConnect.buttonTextRegistering );
			$.ajax( {
				url: jpConnect.apiBaseUrl + '/connection/register',
				type: 'POST',
				data: {
					registration_nonce: jpConnect.registrationNonce,
					_wpnonce: jpConnect.apiNonce,
				},
				error: function( error ) {
					console.log( 'request failed' );
					console.log( error );
					jetpackConnectButton.isRegistering = false;
				},
				success: function( data ) {
					console.log( 'request success' );
					window.addEventListener( 'message', jetpackConnectButton.receiveData );
					$( '.jp-connect-full__button-container' ).html(
						'<iframe src="' + data.authorizeUrl + '" class="jp-jetpack-connect__iframe" />'
					);
				},
			} );
		},
		receiveData: function( event ) {
			if ( event.origin === 'https://jetpack.wordpress.com' ) {
				console.log( 'got message', event );
				// todo: && e.source === this.iframe.contentWindow
				if ( event.data === 'close' ) {
					window.removeEventListener( 'message', this.receiveData );
					jetpackConnectButton.handleAuthorizationComplete();
				}
			}
		},
		handleAuthorizationComplete: function() {
			console.log( 'finishing auth' );
			jetpackConnectButton.isRegistering = false;
			$( '.jp-connect-full__button-container' ).html(
				'<p>' + jpConnect.buttonTextFinishing + '<p>'
			);
			location.reload();
		},
	};
} );
