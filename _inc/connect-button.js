/* global jpConnect */

jQuery( document ).ready( function( $ ) {
	var connectButton = $( '.jp-connect-button' );
	connectButton.click( function( event ) {
		event.preventDefault();
		if ( ! jetpackConnectButton.isRegistering ) {
			jetpackConnectButton.handleClick();
		}
	} );
	var jetpackConnectIframe = $( '<iframe class="jp-jetpack-connect__iframe" />' );

	var jetpackConnectButton = {
		isRegistering: false,
		handleClick: function() {
			jetpackConnectButton.isRegistering = true;
			connectButton
				.text( jpConnect.buttonTextRegistering )
				.attr( 'disabled', true )
				.blur();
			$.ajax( {
				url: jpConnect.apiBaseUrl + '/connection/register',
				type: 'POST',
				data: {
					registration_nonce: jpConnect.registrationNonce,
					_wpnonce: jpConnect.apiNonce,
				},
				error: function( error ) {
					console.warn( 'Connection failed. Falling back to the regular flow', error );
					jetpackConnectButton.isRegistering = false;
					window.location = connectButton.attr( 'href' );
				},
				success: function( data ) {
					window.addEventListener( 'message', jetpackConnectButton.receiveData );
					jetpackConnectIframe.attr( 'src', data.authorizeUrl );
					$( '.jp-connect-full__button-container' ).html( jetpackConnectIframe );
				},
			} );
		},
		receiveData: function( event ) {
			if (
				event.origin === jpConnect.jetpackApiDomain &&
				event.source === jetpackConnectIframe.get( 0 ).contentWindow &&
				event.data === 'close'
			) {
				window.removeEventListener( 'message', this.receiveData );
				jetpackConnectButton.handleAuthorizationComplete();
			}
		},
		handleAuthorizationComplete: function() {
			jetpackConnectButton.isRegistering = false;
			location.reload();
		},
	};
} );
